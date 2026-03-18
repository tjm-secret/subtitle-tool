from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from ..services.meeting_notes_service import (
    MeetingNotesConfigError,
    MeetingNotesGenerationError,
    MeetingNotesService,
)


router = APIRouter(prefix="/meeting-notes", tags=["meeting-notes"])


class MeetingNotesRequest(BaseModel):
    transcript: str


class MeetingNotesResponse(BaseModel):
    summary: str
    highlights: list[str]
    decisions: list[str]
    action_items: list[str]


def get_meeting_notes_service() -> MeetingNotesService:
    return MeetingNotesService.from_env()


@router.post("/", response_model=MeetingNotesResponse)
async def generate_meeting_notes(payload: MeetingNotesRequest):
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transcript is required",
        )

    try:
        service = get_meeting_notes_service()
        result = service.generate(transcript)
    except MeetingNotesConfigError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except MeetingNotesGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return MeetingNotesResponse(**MeetingNotesService.to_dict(result))
