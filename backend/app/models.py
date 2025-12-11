"""
Database models
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Frame(Base):
    """Frame model"""
    __tablename__ = "frames"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # pylint: disable=not-callable
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # pylint: disable=not-callable

    components = relationship("Component", back_populates="frame", cascade="all, delete-orphan")


class Component(Base):
    """Component model"""
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    frame_id = Column(Integer, ForeignKey("frames.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # circle, triangle, rectangle, connection
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    width = Column(Float, default=100.0)
    height = Column(Float, default=100.0)
    properties = Column(JSON, default={})  # Additional properties like color, rotation, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # pylint: disable=not-callable
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # pylint: disable=not-callable

    frame = relationship("Frame", back_populates="components")

