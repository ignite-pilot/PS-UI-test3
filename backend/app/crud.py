"""
CRUD operations
"""
from sqlalchemy.orm import Session
from app import models, schemas
from typing import List, Optional


# Frame CRUD
def create_frame(db: Session, frame: schemas.FrameCreate) -> models.Frame:
    """Create a new frame"""
    db_frame = models.Frame(name=frame.name)
    db.add(db_frame)
    db.commit()
    db.refresh(db_frame)
    return db_frame


def get_frame(db: Session, frame_id: int) -> Optional[models.Frame]:
    """Get frame by ID"""
    return db.query(models.Frame).filter(models.Frame.id == frame_id).first()


def get_frames(db: Session, skip: int = 0, limit: int = 100) -> List[models.Frame]:
    """Get all frames"""
    return db.query(models.Frame).offset(skip).limit(limit).all()


def update_frame(
    db: Session, frame_id: int, frame_update: schemas.FrameUpdate
) -> Optional[models.Frame]:
    """Update frame"""
    db_frame = get_frame(db, frame_id)
    if not db_frame:
        return None

    if frame_update.name is not None:
        db_frame.name = frame_update.name

    db.commit()
    db.refresh(db_frame)
    return db_frame


def delete_frame(db: Session, frame_id: int) -> bool:
    """Delete frame"""
    db_frame = get_frame(db, frame_id)
    if not db_frame:
        return False

    db.delete(db_frame)
    db.commit()
    return True


# Component CRUD
def create_component(db: Session, component: schemas.ComponentCreate) -> models.Component:
    """Create a new component"""
    db_component = models.Component(
        frame_id=component.frame_id,
        name=component.name,
        type=component.type,
        x=component.x,
        y=component.y,
        width=component.width,
        height=component.height,
        properties=component.properties
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component


def get_component(db: Session, component_id: int) -> Optional[models.Component]:
    """Get component by ID"""
    return db.query(models.Component).filter(models.Component.id == component_id).first()


def get_components_by_frame(db: Session, frame_id: int) -> List[models.Component]:
    """Get all components for a frame"""
    return db.query(models.Component).filter(models.Component.frame_id == frame_id).all()


def update_component(
    db: Session, component_id: int, component_update: schemas.ComponentUpdate
) -> Optional[models.Component]:
    """Update component"""
    db_component = get_component(db, component_id)
    if not db_component:
        return None

    if component_update.name is not None:
        db_component.name = component_update.name
    if component_update.x is not None:
        db_component.x = component_update.x
    if component_update.y is not None:
        db_component.y = component_update.y
    if component_update.width is not None:
        db_component.width = component_update.width
    if component_update.height is not None:
        db_component.height = component_update.height
    if component_update.properties is not None:
        db_component.properties = component_update.properties

    db.commit()
    db.refresh(db_component)
    return db_component


def delete_component(db: Session, component_id: int) -> bool:
    """Delete component"""
    db_component = get_component(db, component_id)
    if not db_component:
        return False
    
    db.delete(db_component)
    db.commit()
    return True

