import json
import os
from dataclasses import asdict, dataclass
from typing import Any
from urllib import error, request


class MeetingNotesConfigError(RuntimeError):
    pass


class MeetingNotesGenerationError(RuntimeError):
    pass


@dataclass
class MeetingNotesResult:
    summary: str
    highlights: list[str]
    decisions: list[str]
    action_items: list[str]


def strip_code_fences(content: str) -> str:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 3:
            cleaned = "\n".join(lines[1:-1]).strip()
    return cleaned


def parse_meeting_notes_response(content: str) -> MeetingNotesResult:
    cleaned = strip_code_fences(content)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise MeetingNotesGenerationError("Meeting notes response was not valid JSON") from exc

    required_keys = ("summary", "highlights", "decisions", "action_items")
    missing_keys = [key for key in required_keys if key not in payload]
    if missing_keys:
        raise MeetingNotesGenerationError(f"Meeting notes response missing fields: {', '.join(missing_keys)}")

    def ensure_string_list(value: Any, field_name: str) -> list[str]:
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise MeetingNotesGenerationError(f"Meeting notes field '{field_name}' must be a list of strings")
        return [item.strip() for item in value if item.strip()]

    summary = payload["summary"]
    if not isinstance(summary, str) or not summary.strip():
        raise MeetingNotesGenerationError("Meeting notes field 'summary' must be a non-empty string")

    return MeetingNotesResult(
        summary=summary.strip(),
        highlights=ensure_string_list(payload["highlights"], "highlights"),
        decisions=ensure_string_list(payload["decisions"], "decisions"),
        action_items=ensure_string_list(payload["action_items"], "action_items"),
    )


class OpenAICompatibleClient:
    def __init__(self, *, base_url: str, api_key: str | None, model: str, timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def create_chat_completion(self, messages: list[dict[str, str]]) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
        }
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        req = request.Request(
            url=f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.timeout) as response:
                body = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise MeetingNotesGenerationError(
                f"Meeting notes provider returned HTTP {exc.code}: {detail or 'no response body'}"
            ) from exc
        except error.URLError as exc:
            raise MeetingNotesGenerationError(f"Meeting notes provider request failed: {exc.reason}") from exc

        try:
            return body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise MeetingNotesGenerationError("Meeting notes provider response was missing message content") from exc


class MeetingNotesService:
    def __init__(self, client: OpenAICompatibleClient, system_prompt: str | None = None):
        self.client = client
        self.system_prompt = system_prompt or (
            "You convert meeting transcripts into concise meeting notes. "
            "Always respond with strict JSON using keys: "
            "summary, highlights, decisions, action_items."
        )

    @classmethod
    def from_env(cls) -> "MeetingNotesService":
        base_url = os.getenv("MEETING_NOTES_API_BASE_URL")
        api_key = os.getenv("MEETING_NOTES_API_KEY")
        model = os.getenv("MEETING_NOTES_MODEL")
        system_prompt = os.getenv("MEETING_NOTES_SYSTEM_PROMPT")

        missing = [
            name
            for name, value in (
                ("MEETING_NOTES_API_BASE_URL", base_url),
                ("MEETING_NOTES_MODEL", model),
            )
            if not value
        ]
        if missing:
            raise MeetingNotesConfigError(f"Missing meeting notes config: {', '.join(missing)}")

        client = OpenAICompatibleClient(
            base_url=base_url,
            api_key=api_key,
            model=model,
        )
        return cls(client=client, system_prompt=system_prompt)

    def build_messages(self, transcript: str) -> list[dict[str, str]]:
        return [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    "Summarize the following transcript into meeting notes. "
                    "Return valid JSON only with these fields: "
                    "summary (string), highlights (array of strings), "
                    "decisions (array of strings), action_items (array of strings). "
                    "If a section has no content, return an empty array.\n\n"
                    f"Transcript:\n{transcript.strip()}"
                ),
            },
        ]

    def generate(self, transcript: str) -> MeetingNotesResult:
        normalized = transcript.strip()
        if not normalized:
            raise MeetingNotesGenerationError("Transcript must not be empty")

        content = self.client.create_chat_completion(self.build_messages(normalized))
        return parse_meeting_notes_response(content)

    @staticmethod
    def to_dict(result: MeetingNotesResult) -> dict[str, Any]:
        return asdict(result)
