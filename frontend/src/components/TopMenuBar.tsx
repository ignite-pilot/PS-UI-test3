import React, { useState } from 'react';
import './TopMenuBar.css';

export type ComponentType = 'circle' | 'triangle' | 'rectangle' | 'connection';

interface TopMenuBarProps {
  selectedComponent: ComponentType | null;
  onComponentSelect: (type: ComponentType | null) => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({ selectedComponent, onComponentSelect }) => {
  const handleClick = (type: ComponentType) => {
    if (selectedComponent === type) {
      onComponentSelect(null);
    } else {
      onComponentSelect(type);
    }
  };

  return (
    <div className="top-menu-bar">
      <div className="menu-title">Components</div>
      <div className="component-icons">
        <button
          className={`icon-button ${selectedComponent === 'circle' ? 'active' : ''}`}
          onClick={() => handleClick('circle')}
          title="Circle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
        <button
          className={`icon-button ${selectedComponent === 'triangle' ? 'active' : ''}`}
          onClick={() => handleClick('triangle')}
          title="Triangle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 L22 20 L2 20 Z" />
          </svg>
        </button>
        <button
          className={`icon-button ${selectedComponent === 'rectangle' ? 'active' : ''}`}
          onClick={() => handleClick('rectangle')}
          title="Rectangle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>
        <button
          className={`icon-button ${selectedComponent === 'connection' ? 'active' : ''}`}
          onClick={() => handleClick('connection')}
          title="Connection Line"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12 L20 12 M12 4 L12 20" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TopMenuBar;

