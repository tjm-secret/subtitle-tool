import json
import os
import re

import requests


class ProviderConfigurationError(RuntimeError):
    pass


class ProviderResponseError(RuntimeError):
    pass


def is_meeting_notes_dev_fallback_enabled() -> bool:
    return os.getenv("MEETING_NOTES_DEV_FALLBACK", "").strip().lower() == "true"


def strip_code_fence(content: str) -> str:
    text = str(content or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def normalize_meeting_notes_response(content: str) -> dict:
    text = strip_code_fence(content)

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ProviderResponseError("Meeting notes provider returned invalid JSON") from exc

    return {
        "summary": str(payload.get("summary") or "").strip(),
        "discussion_points": [str(item).strip() for item in payload.get("discussion_points") or [] if str(item).strip()],
        "decisions": [str(item).strip() for item in payload.get("decisions") or [] if str(item).strip()],
        "pending_items": [str(item).strip() for item in payload.get("pending_items") or [] if str(item).strip()],
        "action_items": [str(item).strip() for item in payload.get("action_items") or [] if str(item).strip()],
    }


def build_fallback_meeting_notes(transcript: str) -> dict:
    text = str(transcript or "").strip()
    sentences = [item.strip() for item in re.split(r"(?<=[。！？!?])\s*", text) if item.strip()]

    if not sentences:
        return {
            "summary": "",
            "discussion_points": [],
            "decisions": [],
            "pending_items": [],
            "action_items": [],
        }

    decision_keywords = ("決定", "確認", "採用", "結論", "拍板", "定案")
    pending_keywords = ("待確認", "未決議", "未定案", "待定", "再確認", "仍需討論", "尚未決定")
    action_keywords = ("待辦", "負責", "下週", "跟進", "action", "安排", "處理", "提交")

    pending_items = [
        sentence
        for sentence in sentences
        if any(keyword in sentence for keyword in pending_keywords)
    ]
    decisions = [
        sentence
        for sentence in sentences
        if sentence not in pending_items and any(keyword in sentence for keyword in decision_keywords)
    ]
    action_items = [sentence for sentence in sentences if any(keyword in sentence for keyword in action_keywords)]
    discussion_points = [
        sentence
        for sentence in sentences
        if sentence not in decisions and sentence not in pending_items and sentence not in action_items
    ][:4]

    summary_parts = [sentences[0]]
    if discussion_points:
        summary_parts.append(discussion_points[0])
    if decisions:
        summary_parts.append(decisions[0])

    return {
        "summary": " ".join(dict.fromkeys(summary_parts)).strip(),
        "discussion_points": discussion_points,
        "decisions": decisions,
        "pending_items": pending_items,
        "action_items": action_items,
    }


def get_provider_settings() -> tuple[str, str, str, float]:
    base = os.getenv("MEETING_NOTES_API_BASE", "").strip()
    api_key = os.getenv("MEETING_NOTES_API_KEY", "").strip()
    model = os.getenv("MEETING_NOTES_MODEL", "").strip()
    timeout = float(os.getenv("MEETING_NOTES_TIMEOUT_SECONDS", "30"))

    if not base or not api_key or not model:
        raise ProviderConfigurationError("Meeting notes provider is not configured")

    return base.rstrip("/"), api_key, model, timeout


def validate_meeting_notes_provider_startup() -> None:
    if is_meeting_notes_dev_fallback_enabled():
        return

    get_provider_settings()


def generate_meeting_notes(transcript: str, source_name: str | None = None) -> dict:
    if is_meeting_notes_dev_fallback_enabled():
        return build_fallback_meeting_notes(transcript)

    base, api_key, model, timeout = get_provider_settings()

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a meeting notes assistant.\n"
                    "Return only valid JSON.\n"
                    "Use exactly these top-level keys: summary, discussion_points, decisions, pending_items, action_items.\n"
                    "Keep all keys in English.\n"
                    "Write summary, discussion_points, decisions, pending_items, and action_items in the primary language of the transcript.\n"
                    "If the transcript is primarily Chinese, use Traditional Chinese.\n"
                    "Use pending_items for unresolved questions, undecided topics, or follow-up decisions that are not finalized yet.\n"
                    "Use action_items only for concrete follow-up actions with an owner or clear next step.\n"
                    "Preserve proper nouns, product names, technical terms, and speaker names in their original language when appropriate.\n"
                    "If a section has no content, return an empty string or empty array.\n"
                    "Do not invent facts that are not supported by the transcript."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Source name: {source_name or 'unknown'}\n"
                    "Summarize the following transcript into meeting notes.\n"
                    f"Transcript:\n{transcript}"
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }

    response = requests.post(
        f"{base}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    body = response.json()

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ProviderResponseError("Meeting notes provider returned an unexpected response") from exc

    return normalize_meeting_notes_response(content)
