from typing import Optional

from pydantic import BaseModel


class WorkItem(BaseModel):
    type: str
    title: str
    content: Optional[str] = None
    status: str = "active"
    priority: int = 3


class DebriefRequest(BaseModel):
    content: str


class DebriefConfirmRequest(BaseModel):
    content: str
    summary: str
    project_id: Optional[str] = None
    items: list[WorkItem]


class DebriefConfirmResponse(BaseModel):
    debrief_id: str
    project_id: Optional[str] = None
    items_saved: int