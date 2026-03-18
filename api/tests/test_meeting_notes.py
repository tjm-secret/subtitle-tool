import pytest
from unittest.mock import Mock


def test_normalize_meeting_notes_response_strips_code_fence_and_defaults_missing_fields():
    from src.services.meeting_notes import normalize_meeting_notes_response

    content = """```json
    {
      "summary": "整理後摘要",
      "discussion_points": ["討論 1"],
      "decisions": ["決議 1"]
    }
    ```"""

    result = normalize_meeting_notes_response(content)

    assert result["summary"] == "整理後摘要"
    assert result["discussion_points"] == ["討論 1"]
    assert result["decisions"] == ["決議 1"]
    assert result["action_items"] == []


def test_generate_meeting_notes_raises_configuration_error_when_provider_not_configured(monkeypatch):
    from src.services.meeting_notes import ProviderConfigurationError, generate_meeting_notes

    monkeypatch.delenv("MEETING_NOTES_DEV_FALLBACK", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_BASE", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.delenv("MEETING_NOTES_MODEL", raising=False)

    with pytest.raises(ProviderConfigurationError):
        generate_meeting_notes("逐字稿內容")


def test_generate_meeting_notes_uses_dev_fallback_when_enabled(monkeypatch):
    from src.services.meeting_notes import generate_meeting_notes

    monkeypatch.delenv("MEETING_NOTES_API_BASE", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.delenv("MEETING_NOTES_MODEL", raising=False)
    monkeypatch.setenv("MEETING_NOTES_DEV_FALLBACK", "true")

    result = generate_meeting_notes(
        "今天主要討論首頁改版。我們決定先讓會議記錄支援後端生成。下週由 Steve 負責驗證。"
    )

    assert result["summary"]
    assert isinstance(result["discussion_points"], list)
    assert isinstance(result["decisions"], list)
    assert isinstance(result["action_items"], list)


def test_validate_meeting_notes_provider_startup_raises_when_provider_not_configured(monkeypatch):
    from src.services.meeting_notes import (
        ProviderConfigurationError,
        validate_meeting_notes_provider_startup,
    )

    monkeypatch.delenv("MEETING_NOTES_DEV_FALLBACK", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_BASE", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.delenv("MEETING_NOTES_MODEL", raising=False)

    with pytest.raises(ProviderConfigurationError):
        validate_meeting_notes_provider_startup()


def test_validate_meeting_notes_provider_startup_skips_when_fallback_enabled(monkeypatch):
    from src.services.meeting_notes import validate_meeting_notes_provider_startup

    monkeypatch.setenv("MEETING_NOTES_DEV_FALLBACK", "true")
    monkeypatch.delenv("MEETING_NOTES_API_BASE", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.delenv("MEETING_NOTES_MODEL", raising=False)

    validate_meeting_notes_provider_startup()


def test_generate_meeting_notes_sends_structured_prompt_rules(monkeypatch):
    from src.services.meeting_notes import generate_meeting_notes

    monkeypatch.delenv("MEETING_NOTES_DEV_FALLBACK", raising=False)
    monkeypatch.setenv("MEETING_NOTES_API_BASE", "https://example.com/v1")
    monkeypatch.setenv("MEETING_NOTES_API_KEY", "test-key")
    monkeypatch.setenv("MEETING_NOTES_MODEL", "test-model")

    response = Mock()
    response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"summary":"摘要","discussion_points":[],"decisions":[],"action_items":[]}'
                }
            }
        ]
    }
    response.raise_for_status.return_value = None

    post = Mock(return_value=response)
    monkeypatch.setattr("src.services.meeting_notes.requests.post", post)

    generate_meeting_notes("逐字稿內容", "weekly-sync.wav")

    payload = post.call_args.kwargs["json"]
    system_content = payload["messages"][0]["content"]
    user_content = payload["messages"][1]["content"]

    assert "Return only valid JSON." in system_content
    assert "Keep all keys in English." in system_content
    assert "Write summary, discussion_points, decisions, and action_items in the primary language of the transcript." in system_content
    assert "If the transcript is primarily Chinese, use Traditional Chinese." in system_content
    assert (
        "Preserve proper nouns, product names, technical terms, and speaker names in their original language when appropriate."
        in system_content
    )
    assert "If a section has no content, return an empty string or empty array." in system_content
    assert "Do not invent facts that are not supported by the transcript." in system_content
    assert "Source name: weekly-sync.wav" in user_content
    assert "Summarize the following transcript into meeting notes." in user_content
