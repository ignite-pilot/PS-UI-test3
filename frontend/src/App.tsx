import React, { useState } from 'react';
import './App.css';
import LeftSidebar from './components/LeftSidebar';
import MainArea from './components/MainArea';
import TopMenuBar, { ComponentType } from './components/TopMenuBar';
import FileMenu from './components/FileMenu';
import { FrameProvider } from './contexts/FrameContext';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);

  return (
    <ProjectProvider>
      <FrameProvider>
        <div className="app">
          <div className="app-top-tabs">
            <FileMenu />
          </div>
          <div className="app-header">
            <TopMenuBar
              selectedComponent={selectedComponent}
              onComponentSelect={setSelectedComponent}
            />
          </div>
          <div className="app-content">
            <LeftSidebar />
            <MainArea
              selectedComponent={selectedComponent}
              onComponentSelect={setSelectedComponent}
            />
          </div>
        </div>
      </FrameProvider>
    </ProjectProvider>
  );
}

export default App;

