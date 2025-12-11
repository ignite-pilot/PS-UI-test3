import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

interface OrbitControlsWrapperProps {
  controlsRef: React.MutableRefObject<any>;
  cameraRef: React.MutableRefObject<any>;
  enablePan?: boolean;
}

const OrbitControlsWrapper: React.FC<OrbitControlsWrapperProps> = ({ controlsRef, cameraRef, enablePan = true }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    cameraRef.current = camera;
    
    // OrbitControls가 줌을 변경하지 않도록 설정
    if (controlsRef.current) {
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = enablePan;
    }
  }, [camera, cameraRef, controlsRef, enablePan]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={false}
      enablePan={enablePan}
      enableRotate={false}
      enableDamping={false}
      minZoom={10}
      maxZoom={500}
      zoomSpeed={0}
      mouseButtons={enablePan ? {
        LEFT: 0, // Pan
        MIDDLE: 0,
        RIGHT: 0
      } : {
        LEFT: undefined, // 비활성화
        MIDDLE: 0,
        RIGHT: 0
      }}
      touches={enablePan ? {
        ONE: 0, // Pan
        TWO: 0
      } : {
        ONE: undefined, // 비활성화
        TWO: 0
      }}
    />
  );
};

export default OrbitControlsWrapper;

