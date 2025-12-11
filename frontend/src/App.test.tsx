import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock the FrameContext
const mockFn = () => {};

jest.mock('./contexts/FrameContext', () => ({
  FrameProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrames: () => ({
    frames: [],
    activeFrameId: null,
    openFrameIds: [],
    selectedComponentId: null,
    loading: false,
    refreshFrames: mockFn,
    setActiveFrame: mockFn,
    openFrame: mockFn,
    closeFrame: mockFn,
    createFrame: mockFn,
    updateFrame: mockFn,
    deleteFrame: mockFn,
    createComponent: mockFn,
    updateComponent: mockFn,
    deleteComponent: mockFn,
    setSelectedComponentId: mockFn,
  }),
}));

test('renders app without crashing', () => {
  render(<App />);
  // Basic smoke test
  expect(document.body).toBeTruthy();
});

