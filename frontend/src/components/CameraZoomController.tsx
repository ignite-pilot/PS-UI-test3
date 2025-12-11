import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

interface CameraZoomControllerProps {
  cameraRef: React.MutableRefObject<any>;
}

const CameraZoomController: React.FC<CameraZoomControllerProps> = ({ cameraRef }) => {
  const { camera, invalidate } = useThree();
  const lastZoomRef = useRef<number>((camera as any).zoom || 50);

  useEffect(() => {
    cameraRef.current = camera;
    lastZoomRef.current = (camera as any).zoom || 50;
  }, [camera, cameraRef]);

  useFrame(() => {
    // 매 프레임마다 카메라 줌 확인 및 업데이트
    const currentZoom = (camera as any).zoom;
    
    // 프로젝션 매트릭스를 항상 업데이트 (줌 변경 여부와 관계없이)
    camera.updateProjectionMatrix();
    
    // 줌이 변경되었는지 확인
    if (Math.abs(currentZoom - lastZoomRef.current) > 0.01) {
      lastZoomRef.current = currentZoom;
      console.log('CameraZoomController: Zoom changed to', currentZoom);
    }
    
    // 매 프레임마다 invalidate 호출하여 렌더링 강제
    invalidate();
  });

  return null;
};

export default CameraZoomController;

