import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import { useFrames } from '../contexts/FrameContext';
import { ComponentType } from './TopMenuBar';
import ComponentRenderer from './ComponentRenderer';
import { ContextMenu, MenuItem } from './ContextMenu';
import OrbitControlsWrapper from './OrbitControlsWrapper';
import AdaptiveGrid from './AdaptiveGrid';
import CameraZoomController from './CameraZoomController';
import './FrameView.css';

interface FrameViewProps {
  frameId: number;
  selectedComponent: ComponentType | null;
  onComponentSelect: (type: ComponentType | null) => void;
}

const FrameView: React.FC<FrameViewProps> = ({
  frameId,
  selectedComponent,
  onComponentSelect,
}) => {
  const { frames, selectedComponentId, setSelectedComponentId, createComponent, updateComponent, deleteComponent } = useFrames();
  const frame = frames.find(f => f.id === frameId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: number } | null>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 모든 wheel 이벤트 처리 (터치패드 및 마우스 휠 모두)
      if (cameraRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const delta = e.deltaY;
        const currentZoom = cameraRef.current.zoom || 50;
        
        // 터치패드 감지: deltaMode가 0이고 deltaY가 작은 경우
        const isTouchpad = e.deltaMode === 0 && Math.abs(delta) < 50;
        
        // 터치패드의 경우 더 부드러운 줌
        const zoomFactor = isTouchpad ? 0.05 : 0.15;
        // 최소 줌을 10으로, 최대 줌을 500으로 제한
        const newZoom = Math.max(10, Math.min(500, currentZoom - delta * zoomFactor));
        
        // 카메라 줌 업데이트
        if (cameraRef.current) {
          cameraRef.current.zoom = newZoom;
          cameraRef.current.updateProjectionMatrix();
          
          // OrbitControls도 업데이트 (pan을 위해)
          if (controlsRef.current) {
            // OrbitControls의 카메라 참조도 업데이트
            controlsRef.current.object = cameraRef.current;
            controlsRef.current.update();
          }
          
          console.log('Zoom updated:', newZoom, 'delta:', delta, 'isTouchpad:', isTouchpad, 'camera.zoom:', cameraRef.current.zoom);
        }
      }
    };

    const handleContextMenu = (e: CustomEvent) => {
      setContextMenu({
        x: e.detail.x,
        y: e.detail.y,
        componentId: e.detail.componentId
      });
    };

    const handleClick = () => {
      setContextMenu(null);
    };

    const container = containerRef.current;
    if (container) {
      // capture phase에서 이벤트를 먼저 캡처하여 OrbitControls보다 우선 처리
      container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      window.addEventListener('component-context-menu', handleContextMenu as EventListener);
      window.addEventListener('click', handleClick);
      return () => {
        container.removeEventListener('wheel', handleWheel, { capture: true } as any);
        window.removeEventListener('component-context-menu', handleContextMenu as EventListener);
        window.removeEventListener('click', handleClick);
      };
    }
  }, []);

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (selectedComponent && selectedComponent !== 'connection') {
      const rect = event.currentTarget.getBoundingClientRect();
      
      if (!cameraRef.current) {
        console.error('Camera ref is not available');
        return;
      }
      
      const camera = cameraRef.current;
      const currentZoom = camera.zoom || 50;
      
      // 카메라의 프로젝션 매트릭스를 업데이트하여 최신 left/right/top/bottom 값 확보
      camera.updateProjectionMatrix();
      
      // 카메라의 실제 left/right/top/bottom 값 가져오기
      const orthoCamera = camera as any;
      const cameraLeft = orthoCamera.left ?? -5;
      const cameraRight = orthoCamera.right ?? 5;
      const cameraTop = orthoCamera.top ?? 5;
      const cameraBottom = orthoCamera.bottom ?? -5;
      
      const viewWidth = cameraRight - cameraLeft;
      const viewHeight = cameraTop - cameraBottom;
      
      // OrbitControls의 타겟 위치 가져오기 (pan 상태 고려)
      let cameraTargetX = 0;
      let cameraTargetY = 0;
      if (controlsRef.current && controlsRef.current.target) {
        cameraTargetX = controlsRef.current.target.x;
        cameraTargetY = controlsRef.current.target.y;
      }
      
      // 화면 좌표를 NDC 좌표로 변환 (-1 ~ 1)
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1); // Y축 반전
      
      // Raycaster를 사용하여 정확한 world 좌표 계산
      const raycaster = new Raycaster();
      const mouse = new Vector2(mouseX, mouseY);
      raycaster.setFromCamera(mouse, camera);
      
      // Orthographic camera의 경우, raycaster.ray.origin과 direction을 사용
      // 하지만 더 정확한 방법은 카메라의 실제 뷰 매트릭스를 사용하는 것
      // 카메라의 left/right/top/bottom은 타겟을 기준으로 한 상대 좌표입니다
      // 따라서 타겟을 중심으로 NDC를 world 좌표로 변환해야 합니다
      const worldX = cameraTargetX + mouseX * (viewWidth / 2);
      const worldY = cameraTargetY + mouseY * (viewHeight / 2);
      
      // 줌에 따라 컴포넌트 크기 조정
      const viewSize = Math.max(viewWidth, viewHeight);
      const componentBaseSize = viewSize * 0.1; // view size의 10%
      const componentSize = componentBaseSize;

      console.log('Click:', event.clientX, event.clientY, 'rect:', rect.left, rect.top, rect.width, rect.height);
      console.log('NDC:', mouseX.toFixed(3), mouseY.toFixed(3));
      console.log('Camera target:', cameraTargetX, cameraTargetY);
      console.log('Camera bounds:', { left: cameraLeft, right: cameraRight, top: cameraTop, bottom: cameraBottom });
      console.log('World:', worldX.toFixed(3), worldY.toFixed(3), 'zoom:', currentZoom, 'viewWidth:', viewWidth.toFixed(3), 'viewHeight:', viewHeight.toFixed(3));

      createComponent({
        frame_id: frameId,
        name: `${selectedComponent}-${Date.now()}`,
        type: selectedComponent,
        x: worldX,
        y: worldY,
        width: componentSize,
        height: componentSize,
        properties: {},
      });

      onComponentSelect(null);
    }
  };

  const handleComponentRightClick = (componentId: number, event: React.MouseEvent) => {
    event.preventDefault();
    // Context menu will be handled by ComponentRenderer
  };

  if (!frame) {
    return <div className="frame-view-error">Frame not found</div>;
  }

  return (
    <div ref={containerRef} className="frame-view" onContextMenu={(e) => e.preventDefault()}>
      <Canvas
        camera={{ 
          position: [0, 0, 100], 
          zoom: 50, 
          near: 0.1, 
          far: 1000,
          left: -5,
          right: 5,
          top: 5,
          bottom: -5
        }}
        orthographic
        dpr={[1, 2]}
        onClick={handleCanvasClick}
        onCreated={(state) => {
          cameraRef.current = state.camera;
          // 초기 줌 설정
          state.camera.zoom = 50;
          // 카메라의 left/right/top/bottom 명시적 설정 (OrthographicCamera로 타입 캐스팅)
          const orthoCamera = state.camera as any;
          // OrthographicCamera의 left/right/top/bottom 속성 설정
          orthoCamera.left = -5;
          orthoCamera.right = 5;
          orthoCamera.top = 5;
          orthoCamera.bottom = -5;
          state.camera.updateProjectionMatrix();
          console.log('Canvas created, camera:', state.camera);
          console.log('Camera bounds:', { left: orthoCamera.left, right: orthoCamera.right, top: orthoCamera.top, bottom: orthoCamera.bottom });
          console.log('Camera zoom:', state.camera.zoom);
          console.log('Frame components:', frame.components);
        }}
      >
        <CameraZoomController cameraRef={cameraRef} />
        <AdaptiveGrid />
        <ambientLight intensity={1} />
        {frame.components.map((component) => (
          <ComponentRenderer
            key={component.id}
            component={component}
            isSelected={selectedComponentId === component.id}
            onSelect={() => setSelectedComponentId(component.id)}
            onUpdate={(updates) => updateComponent(component.id, updates)}
            onDelete={() => deleteComponent(component.id)}
          />
        ))}
        <OrbitControlsWrapper 
          controlsRef={controlsRef}
          cameraRef={cameraRef}
        />
      </Canvas>
      {selectedComponent && (
        <div className="placement-hint">
          Click on the canvas to place a {selectedComponent}
        </div>
      )}
      {contextMenu && (
        <div
          className="context-menu-overlay"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextMenu id={`component-menu-${contextMenu.componentId}`}>
            <MenuItem onClick={() => {
              const component = frame?.components.find(c => c.id === contextMenu.componentId);
              if (component) {
                const newName = prompt('Enter new component name:', component.name);
                if (newName && newName.trim()) {
                  updateComponent(component.id, { name: newName.trim() });
                }
              }
              setContextMenu(null);
            }}>
              Rename Component
            </MenuItem>
            <MenuItem onClick={() => {
              deleteComponent(contextMenu.componentId);
              setContextMenu(null);
            }}>
              Delete Component
            </MenuItem>
          </ContextMenu>
        </div>
      )}
    </div>
  );
};

export default FrameView;

