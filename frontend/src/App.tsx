import React from 'react';
import './App.css';
import LeftSidebar from './components/LeftSidebar';
import MainArea from './components/MainArea';
import { FrameProvider } from './contexts/FrameContext';

function App() {
  return (
    <FrameProvider>
      <div className="app">
        <div className="app-content">
          <LeftSidebar />
          <MainArea />
        </div>
      </div>
    </FrameProvider>
  );
}

export default App;

