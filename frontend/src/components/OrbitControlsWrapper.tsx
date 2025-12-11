import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

interface OrbitControlsWrapperProps {
  controlsRef: React.MutableRefObject<any>;
  cameraRef: React.MutableRefObject<any>;
}

const OrbitControlsWrapper: React.FC<OrbitControlsWrapperProps> = ({ controlsRef, cameraRef }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    cameraRef.current = camera;
    
    // OrbitControls가 줌을 변경하지 않도록 설정
    if (controlsRef.current) {
      controlsRef.current.enableZoom = false;
    }
  }, [camera, cameraRef, controlsRef]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={false}
      enablePan={true}
      enableRotate={false}
      enableDamping={false}
      minZoom={10}
      maxZoom={500}
      zoomSpeed={0}
      mouseButtons={{
        LEFT: 0, // Pan
        MIDDLE: 0,
        RIGHT: 0
      }}
      touches={{
        ONE: 0, // Pan
        TWO: 0
      }}
    />
  );
};

export default OrbitControlsWrapper;

