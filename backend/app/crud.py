"""
CRUD operations
"""
from sqlalchemy.orm import Session
from app import models, schemas
from typing import List, Optional


# Project CRUD
def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    """Create a new project"""
    try:
        db_project = models.Project(name=project.name)
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except Exception as e:
        db.rollback()
        raise


def get_project(db: Session, project_id: int) -> Optional[models.Project]:
    """Get project by ID"""
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100) -> List[models.Project]:
    """Get all projects"""
    return db.query(models.Project).offset(skip).limit(limit).all()


def update_project(
    db: Session, project_id: int, project_update: schemas.ProjectUpdate
) -> Optional[models.Project]:
    """Update project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None

    if project_update.name is not None:
        db_project.name = project_update.name

    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    """Delete project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return False

    db.delete(db_project)
    db.commit()
    return True


# Frame CRUD
def create_frame(db: Session, frame: schemas.FrameCreate) -> models.Frame:
    """Create a new frame"""
    db_frame = models.Frame(name=frame.name, project_id=frame.project_id)
    db.add(db_frame)
    db.commit()
    db.refresh(db_frame)
    return db_frame


def get_frame(db: Session, frame_id: int) -> Optional[models.Frame]:
    """Get frame by ID"""
    return db.query(models.Frame).filter(models.Frame.id == frame_id).first()


def get_frames(db: Session, skip: int = 0, limit: int = 100, project_id: Optional[int] = None) -> List[models.Frame]:
    """Get all frames, optionally filtered by project_id"""
    query = db.query(models.Frame)
    if project_id is not None:
        query = query.filter(models.Frame.project_id == project_id)
    return query.offset(skip).limit(limit).all()


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

