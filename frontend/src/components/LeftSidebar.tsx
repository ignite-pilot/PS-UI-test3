import React, { useState } from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from './ContextMenu';
import { useFrames } from '../contexts/FrameContext';
import { useProject } from '../contexts/ProjectContext';
import './LeftSidebar.css';

const LeftSidebar: React.FC = () => {
  const { currentProject } = useProject();
  const {
    frames,
    activeFrameId,
    setActiveFrame,
    createFrame,
    updateFrame,
    deleteFrame,
    updateComponent,
  } = useFrames();
  const [editingFrameId, setEditingFrameId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateFrame = async () => {
    if (!currentProject) {
      alert('프로젝트를 먼저 선택하거나 생성해주세요.');
      return;
    }
    const name = prompt('Enter frame name:');
    if (name) {
      await createFrame(name);
    }
  };

  const handleRenameFrame = (frameId: number, currentName: string) => {
    setEditingFrameId(frameId);
    setEditName(currentName);
  };

  const handleSaveRename = async (frameId: number) => {
    if (editName.trim()) {
      await updateFrame(frameId, editName.trim());
    }
    setEditingFrameId(null);
    setEditName('');
  };

  const handleDeleteFrame = async (frameId: number) => {
    if (window.confirm('Are you sure you want to delete this frame?')) {
      await deleteFrame(frameId);
    }
  };

  const handleRenameComponent = async (componentId: number, currentName: string) => {
    const newName = prompt('Enter new component name:', currentName);
    if (newName && newName.trim()) {
      await updateComponent(componentId, { name: newName.trim() });
    }
  };

  const { deleteComponent } = useFrames();

  const handleDeleteComponent = async (componentId: number) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      await deleteComponent(componentId);
    }
  };

  return (
    <div className="left-sidebar">
      <div className="sidebar-header">
        <ContextMenuTrigger id="frames-context-menu">
          <div className="frames-root-node">
            <span className="node-icon">📁</span>
            <span>Frames</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenu id="frames-context-menu">
          <MenuItem onClick={handleCreateFrame}>
            Create Frame
          </MenuItem>
        </ContextMenu>
      </div>
      <div className="frames-list">
        {frames.map((frame) => (
          <div key={frame.id} className="frame-node">
            <ContextMenuTrigger id={`frame-context-${frame.id}`}>
              <div
                className={`frame-item ${activeFrameId === frame.id ? 'active' : ''}`}
                onClick={() => setActiveFrame(frame.id)}
              >
                <span className="node-icon">📄</span>
                {editingFrameId === frame.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveRename(frame.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRename(frame.id);
                      }
                    }}
                    autoFocus
                    className="rename-input"
                  />
                ) : (
                  <span>{frame.name}</span>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenu id={`frame-context-${frame.id}`}>
              <MenuItem onClick={() => handleRenameFrame(frame.id, frame.name)}>
                Rename Frame
              </MenuItem>
              <MenuItem onClick={() => handleDeleteFrame(frame.id)}>
                Delete Frame
              </MenuItem>
            </ContextMenu>
            {frame.components && frame.components.length > 0 && (
              <div className="components-list">
                {frame.components.map((component) => (
                  <ContextMenuTrigger key={component.id} id={`component-context-${component.id}`}>
                    <div className="component-item">
                      <span className="node-icon">
                        {component.type === 'circle' && '⭕'}
                        {component.type === 'triangle' && '🔺'}
                        {component.type === 'rectangle' && '▭'}
                        {component.type === 'connection' && '➖'}
                      </span>
                      <span>{component.name}</span>
                    </div>
                  </ContextMenuTrigger>
                ))}
                {frame.components.map((component) => (
                  <ContextMenu key={component.id} id={`component-context-${component.id}`}>
                    <MenuItem onClick={() => handleRenameComponent(component.id, component.name)}>
                      Rename Component
                    </MenuItem>
                    <MenuItem onClick={() => handleDeleteComponent(component.id)}>
                      Delete Component
                    </MenuItem>
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftSidebar;

