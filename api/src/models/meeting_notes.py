from pydantic import BaseModel, Field, field_validator


class MeetingNotesRequest(BaseModel):
    transcript: str = Field(..., description="Transcript text used to generate meeting notes")
    source_name: str | None = Field(default=None, description="Optional original file name")

    @field_validator("transcript")
    @classmethod
    def validate_transcript(cls, value: str) -> str:
        text = str(value or "").strip()
        if not text:
            raise ValueError("Transcript is required")
        return text


class MeetingNotesResponse(BaseModel):
    summary: str = ""
    discussion_points: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    pending_items: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
