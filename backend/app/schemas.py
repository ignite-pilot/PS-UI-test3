"""
Pydantic schemas for API requests/responses
"""
from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, ConfigDict


class ComponentBase(BaseModel):
    """Base component schema"""
    name: str
    type: str
    x: float = 0.0
    y: float = 0.0
    width: float = 100.0
    height: float = 100.0
    properties: Dict[str, Any] = {}


class ComponentCreate(ComponentBase):
    """Component creation schema"""
    frame_id: int


class ComponentUpdate(BaseModel):
    """Component update schema"""
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None


class ComponentResponse(ComponentBase):
    """Component response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    frame_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class FrameBase(BaseModel):
    """Base frame schema"""
    name: str


class FrameCreate(FrameBase):
    """Frame creation schema"""
    pass


class FrameUpdate(BaseModel):
    """Frame update schema"""
    name: Optional[str] = None


class FrameResponse(FrameBase):
    """Frame response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    components: list[ComponentResponse] = []

