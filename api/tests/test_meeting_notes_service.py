from src.services.meeting_notes_service import (
    MeetingNotesConfigError,
    MeetingNotesGenerationError,
    MeetingNotesService,
    OpenAICompatibleClient,
    parse_meeting_notes_response,
)


class DummyClient(OpenAICompatibleClient):
    def __init__(self, response_text: str):
        self.response_text = response_text

    def create_chat_completion(self, messages):
        self.messages = messages
        return self.response_text


def test_parse_meeting_notes_json():
    payload = '{"summary":"Sprint sync","highlights":["Roadmap updated"],"decisions":["Ship Friday"],"action_items":["Alex to update changelog"]}'

    result = parse_meeting_notes_response(payload)

    assert result.summary == "Sprint sync"
    assert result.highlights == ["Roadmap updated"]
    assert result.decisions == ["Ship Friday"]
    assert result.action_items == ["Alex to update changelog"]


def test_parse_meeting_notes_json_missing_fields():
    payload = '{"summary":"Sprint sync","highlights":[]}'

    try:
        parse_meeting_notes_response(payload)
        assert False, "Expected MeetingNotesGenerationError"
    except MeetingNotesGenerationError as exc:
        assert "missing fields" in str(exc)


def test_meeting_notes_service_requires_config(monkeypatch):
    monkeypatch.delenv("MEETING_NOTES_API_BASE_URL", raising=False)
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.delenv("MEETING_NOTES_MODEL", raising=False)

    try:
        MeetingNotesService.from_env()
        assert False, "Expected MeetingNotesConfigError"
    except MeetingNotesConfigError as exc:
        assert "MEETING_NOTES_API_BASE_URL" in str(exc)


def test_meeting_notes_service_allows_missing_api_key(monkeypatch):
    monkeypatch.setenv("MEETING_NOTES_API_BASE_URL", "http://localhost:8000/v1")
    monkeypatch.delenv("MEETING_NOTES_API_KEY", raising=False)
    monkeypatch.setenv("MEETING_NOTES_MODEL", "fake-model")

    service = MeetingNotesService.from_env()

    assert service.client.api_key is None


def test_meeting_notes_service_builds_json_prompt():
    client = DummyClient('{"summary":"A","highlights":[],"decisions":[],"action_items":[]}')
    service = MeetingNotesService(client=client)

    result = service.generate("Discuss roadmap and assign next steps.")

    assert result.summary == "A"
    assert "Return valid JSON only" in client.messages[1]["content"]
    assert "Discuss roadmap and assign next steps." in client.messages[1]["content"]
