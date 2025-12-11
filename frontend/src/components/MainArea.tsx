import React from 'react';
import { useFrames } from '../contexts/FrameContext';
import { ComponentType } from './TopMenuBar';
import FrameView from './FrameView';
import './MainArea.css';

interface MainAreaProps {
  selectedComponent: ComponentType | null;
  onComponentSelect: (type: ComponentType | null) => void;
}

const MainArea: React.FC<MainAreaProps> = ({ selectedComponent, onComponentSelect }) => {
  const { frames, openFrameIds, activeFrameId, setActiveFrame, closeFrame } = useFrames();

  const handleTabClick = (frameId: number) => {
    setActiveFrame(frameId);
  };

  const handleTabClose = (e: React.MouseEvent, frameId: number) => {
    e.stopPropagation();
    closeFrame(frameId);
  };

  return (
    <div className="main-area">
      <div className="tabs-container">
        {openFrameIds.map((frameId) => (
          <div
            key={frameId}
            className={`tab ${activeFrameId === frameId ? 'active' : ''}`}
            onClick={() => handleTabClick(frameId)}
          >
            <span>{frames.find(f => f.id === frameId)?.name || `Frame ${frameId}`}</span>
            <button
              className="tab-close"
              onClick={(e) => handleTabClose(e, frameId)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="frame-view-container">
        {activeFrameId && (
          <FrameView
            frameId={activeFrameId}
            selectedComponent={selectedComponent}
            onComponentSelect={onComponentSelect}
          />
        )}
        {!activeFrameId && (
          <div className="empty-state">
            <p>No frame selected</p>
            <p className="hint">Create a frame from the sidebar to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainArea;

