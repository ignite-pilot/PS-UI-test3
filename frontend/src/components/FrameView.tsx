import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Shape, ExtrudeGeometry, CircleGeometry, ShapeGeometry, Vector3, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line, LineSegments } from 'three';
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
  const [connectionSourceId, setConnectionSourceId] = useState<number | null>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  // ESC 키로 연결선 모드 해제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedComponent === 'connection') {
        setConnectionSourceId(null);
        setSelectedComponentId(null);
        onComponentSelect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponent, onComponentSelect]);

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
    // 연결선 모드에서는 Canvas 클릭 무시 (mesh 클릭만 처리)
    if (selectedComponent === 'connection') {
      // 컴포넌트가 아닌 곳을 클릭하면 첫 번째 선택만 취소 (모드는 유지)
      if (connectionSourceId !== null) {
        setConnectionSourceId(null);
        setSelectedComponentId(null);
      }
      return;
    }
    
    // 연결선 모드가 아닐 때만 컴포넌트 생성 처리
    if (selectedComponent === 'circle' || selectedComponent === 'triangle' || selectedComponent === 'rectangle') {
      const rect = event.currentTarget.getBoundingClientRect();
      
      if (!cameraRef.current) {
        return;
      }
      
      const camera = cameraRef.current;
      const currentZoom = camera.zoom || 50;
      
      // 카메라의 프로젝션 매트릭스를 업데이트하여 최신 left/right/top/bottom 값 확보
      camera.updateProjectionMatrix();
      
      // 카메라의 기본 left/right/top/bottom 값 (줌 적용 전)
      const orthoCamera = camera as any;
      const baseLeft = -5;
      const baseRight = 5;
      const baseTop = 5;
      const baseBottom = -5;
      
      // 줌을 고려한 실제 뷰 크기 계산
      // 줌이 클수록 실제 보이는 영역이 작아짐
      const viewWidth = (baseRight - baseLeft) / currentZoom;
      const viewHeight = (baseTop - baseBottom) / currentZoom;
      
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
      
      // Orthographic 카메라에서 NDC를 world 좌표로 변환
      // 줌을 고려한 실제 뷰 크기를 사용하여 변환
      const worldX = cameraTargetX + mouseX * (viewWidth / 2);
      const worldY = cameraTargetY + mouseY * (viewHeight / 2);
      
      // 고정된 컴포넌트 크기 사용 (줌과 무관하게 일정한 크기)
      // 카메라 뷰 크기가 10x10이므로 0.01 크기가 적절함
      const componentSize = 0.01; // 적절한 고정 크기

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

  const handleComponentClick = (componentId: number, e?: any) => {
    console.log('handleComponentClick called', { componentId, selectedComponent, connectionSourceId });
    
    // 이벤트 전파 중지
    if (e) {
      e.stopPropagation();
    }
    
    // 연결선 모드일 때만 처리
    if (selectedComponent === 'connection') {
      console.log('Connection mode active');
      if (connectionSourceId === null) {
        // 첫 번째 컴포넌트 선택 (연결선 모드는 유지)
        setConnectionSourceId(componentId);
        setSelectedComponentId(componentId);
        // 연결선 모드는 해제하지 않음
      } else if (connectionSourceId === componentId) {
        // 같은 컴포넌트를 다시 클릭하면 첫 번째 선택 취소 (연결선 모드는 유지)
        setConnectionSourceId(null);
        setSelectedComponentId(null);
      } else {
        // 두 번째 컴포넌트 선택 - 연결선 생성
        const sourceComponent = frame?.components.find(c => c.id === connectionSourceId);
        const targetComponent = frame?.components.find(c => c.id === componentId);
        
        if (sourceComponent && targetComponent) {
          console.log('Creating connection', { sourceComponent, targetComponent });
          // 연결선 생성 (시작점과 끝점의 중간 위치에 생성)
          const midX = (sourceComponent.x + targetComponent.x) / 2;
          const midY = (sourceComponent.y + targetComponent.y) / 2;
          const distance = Math.sqrt(
            Math.pow(targetComponent.x - sourceComponent.x, 2) + 
            Math.pow(targetComponent.y - sourceComponent.y, 2)
          );
          
          console.log('Connection data', { midX, midY, distance, sourceId: connectionSourceId, targetId: componentId });
          
          createComponent({
            frame_id: frameId,
            name: `connection-${Date.now()}`,
            type: 'connection',
            x: midX,
            y: midY,
            width: distance,
            height: 0,
            properties: {
              sourceId: connectionSourceId,
              targetId: componentId,
              sourceX: sourceComponent.x,
              sourceY: sourceComponent.y,
              targetX: targetComponent.x,
              targetY: targetComponent.y,
            },
          });
          
          console.log('Connection created');
          
          // 연결 모드 종료
          setConnectionSourceId(null);
          setSelectedComponentId(null);
          onComponentSelect(null);
        }
      }
    }
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
        }}
      >
        <CameraZoomController cameraRef={cameraRef} />
        <AdaptiveGrid />
        <ambientLight intensity={1} />
        {/* 연결선 렌더링 */}
        {frame?.components
          ?.filter(c => c.type === 'connection')
          .map((connection) => {
            const sourceId = connection.properties?.sourceId;
            const targetId = connection.properties?.targetId;
            const sourceComponent = frame?.components.find(c => c.id === sourceId);
            const targetComponent = frame?.components.find(c => c.id === targetId);
            
            console.log('Connection render', { connection, sourceId, targetId, sourceComponent, targetComponent });
            
            if (!sourceComponent || !targetComponent) {
              console.log('Missing source or target component');
              return null;
            }
            
            // 컴포넌트 크기 계산
            const sourceSize = Math.max(sourceComponent.width || 0.01, sourceComponent.height || 0.01);
            const targetSize = Math.max(targetComponent.width || 0.01, targetComponent.height || 0.01);
            const sourceRadius = sourceSize / 2;
            const targetRadius = targetSize / 2;
            
            // 연결선 방향 계산
            const dx = targetComponent.x - sourceComponent.x;
            const dy = targetComponent.y - sourceComponent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // 시작점과 끝점을 컴포넌트 가장자리에서 시작
            const startX = sourceComponent.x + Math.cos(angle) * sourceRadius;
            const startY = sourceComponent.y + Math.sin(angle) * sourceRadius;
            const endX = targetComponent.x - Math.cos(angle) * targetRadius;
            const endY = targetComponent.y - Math.sin(angle) * targetRadius;
            
            // 화살표 크기
            const arrowSize = 0.05;
            const arrowOffset = 0.08; // 타겟에서 떨어진 거리
            
            // 화살표 위치 (타겟에서 약간 뒤로)
            const arrowX = endX - Math.cos(angle) * arrowOffset;
            const arrowY = endY - Math.sin(angle) * arrowOffset;
            
            // 선을 위한 points 배열 생성
            const lineEndX = endX - Math.cos(angle) * arrowOffset;
            const lineEndY = endY - Math.sin(angle) * arrowOffset;
            const points = [
              new Vector3(startX, startY, 2.0), // Z 위치를 도형보다 앞에
              new Vector3(lineEndX, lineEndY, 2.0)
            ];
            
            // BufferGeometry 생성
            const lineGeometry = new BufferGeometry();
            lineGeometry.setAttribute('position', new Float32BufferAttribute(points.flatMap(p => [p.x, p.y, p.z]), 3));
            
            // Line 객체 생성
            const lineMaterial = new LineBasicMaterial({ color: '#ff0000', linewidth: 5 });
            const line = new Line(lineGeometry, lineMaterial);
            
            // 화살표 geometry 생성 (삼각형)
            const arrowShape = new Shape();
            arrowShape.moveTo(0, arrowSize / 2);
            arrowShape.lineTo(arrowSize, 0);
            arrowShape.lineTo(0, -arrowSize / 2);
            arrowShape.lineTo(0, arrowSize / 2);
            const arrowGeometry = new ShapeGeometry(arrowShape);
            
            return (
              <group key={`connection-${connection.id}`}>
                {/* 연결선 */}
                <primitive object={line} />
                {/* 화살표 */}
                <mesh
                  position={[arrowX, arrowY, 2.0]}
                  rotation={[0, 0, angle]}
                  geometry={arrowGeometry}
                >
                  <meshBasicMaterial color="#ff0000" side={2} />
                </mesh>
              </group>
            );
          })}
        {/* 도형 렌더링 */}
        {/* 문제 분석: 격자는 보이는데 mesh가 안 보임 */}
        {/* 격자는 primitive로 렌더링, mesh는 일반 JSX로 렌더링 */}
        {/* 도형 렌더링 */}
        {(() => {
          if (!frame || !frame.components || frame.components.length === 0) {
            return null;
          }
          
          const validComponents = frame.components.filter(c => c.type !== 'connection');
          
          // 카메라 줌 자동 조정 로직 제거 - 사용자가 수동으로 줌을 조정할 수 있도록 함
          // (렌더링마다 실행되어 도형 클릭 시 불필요한 줌 변경 발생 방지)
          
          return validComponents.map((component) => {
            // 크기 계산 - 저장된 원본 크기를 그대로 사용
            // 생성 시 크기(0.01)와 일치하도록 동일한 값 사용
            const originalWidth = component.width || 0.01;
            const originalHeight = component.height || 0.01;
            
            // 저장된 크기를 그대로 사용 (생성 시 크기와 일치)
            // 기존에 너무 큰 도형만 제한하기 위해 최대 크기만 설정
            const maxSize = 2.0; // 기존 큰 도형 제한용
            const calculatedSize = Math.max(originalWidth, originalHeight);
            const size = Math.min(calculatedSize, maxSize); // 최대만 제한
            
            // 타입별 색상 설정 (선택된 경우 파란색, 연결선 모드에서 첫 번째 선택된 경우 초록색)
            let color = '#ff0000'; // 기본 빨간색
            if (connectionSourceId === component.id) {
              color = '#00ff00'; // 연결선 모드에서 첫 번째 선택된 경우 초록색
            } else if (selectedComponentId === component.id) {
              color = '#0000ff'; // 선택된 경우 파란색
            } else {
              // 타입별로 다른 색상
              switch (component.type) {
                case 'circle':
                  color = '#ff6b6b'; // 연한 빨간색
                  break;
                case 'rectangle':
                  color = '#4ecdc4'; // 청록색
                  break;
                case 'triangle':
                  color = '#ffe66d'; // 노란색
                  break;
                default:
                  color = '#ff0000';
              }
            }
            
            // 실제 좌표 값 확인
            const x = component.x || 0;
            const y = component.y || 0;
            
            // 격자가 Z=0에 있으므로 도형은 Z=1.0에 위치하여 확실히 앞에 표시
            // 도형 타입에 따라 적절한 geometry 사용
            const radius = size / 2;
            
            // 도형 타입별 렌더링
            if (component.type === 'circle') {
              // 원형 geometry 사용 - React Three Fiber의 JSX 컴포넌트 방식 사용
              return (
                <mesh 
                  key={`shape-${component.id}`}
                  position={[x, y, 1.0]} 
                  visible={true} 
                  renderOrder={1000} 
                  frustumCulled={false}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    console.log('Circle clicked', component.id);
                    handleComponentClick(component.id, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Circle onClick', component.id);
                    handleComponentClick(component.id, e);
                  }}
                >
                  <circleGeometry args={[radius, 64]} />
                  <meshBasicMaterial 
                    color={color} 
                    side={2}
                    depthTest={true}
                    depthWrite={true}
                    transparent={false}
                    opacity={1}
                  />
                </mesh>
              );
            } else if (component.type === 'triangle') {
              // 삼각형: ShapeGeometry를 사용하여 평면 삼각형 생성
              const triangleShape = new Shape();
              const halfSize = size / 2;
              triangleShape.moveTo(0, halfSize);
              triangleShape.lineTo(-halfSize, -halfSize);
              triangleShape.lineTo(halfSize, -halfSize);
              triangleShape.lineTo(0, halfSize);
              
              const triangleGeometry = new ShapeGeometry(triangleShape);
              
              return (
                <mesh 
                  key={`shape-${component.id}`}
                  position={[x, y, 1.0]} 
                  visible={true} 
                  renderOrder={1000} 
                  frustumCulled={false}
                  geometry={triangleGeometry}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    console.log('Triangle clicked', component.id);
                    handleComponentClick(component.id, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Triangle onClick', component.id);
                    handleComponentClick(component.id, e);
                  }}
                >
                  <meshBasicMaterial 
                    color={color} 
                    side={2} 
                    depthTest={true}
                    depthWrite={true}
                    transparent={false}
                    opacity={1}
                  />
                </mesh>
              );
            } else {
              // 사각형 geometry 사용
              return (
                <mesh 
                  key={`shape-${component.id}`}
                  position={[x, y, 1.0]} 
                  visible={true} 
                  renderOrder={1000} 
                  frustumCulled={false}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    console.log('Rectangle clicked', component.id);
                    handleComponentClick(component.id, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Rectangle onClick', component.id);
                    handleComponentClick(component.id, e);
                  }}
                >
                  <planeGeometry args={[size, size]} />
                  <meshBasicMaterial 
                    color={color} 
                    side={2} 
                    depthTest={true}
                    depthWrite={true}
                    transparent={false}
                    opacity={1}
                  />
                </mesh>
              );
            }
          });
        })()}
        {/* 디버깅용: 모든 도형의 중심점에 큰 점 표시 - 일시적으로 비활성화 */}
        {/* {frame.components && frame.components.length > 0 && frame.components.map((component) => (
          <mesh key={`debug-${component.id}`} position={[component.x, component.y, 11.0]} renderOrder={1001} frustumCulled={false}>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshBasicMaterial color="#00ff00" depthTest={false} />
          </mesh>
        ))} */}
        <OrbitControlsWrapper
          controlsRef={controlsRef}
          cameraRef={cameraRef}
          enablePan={selectedComponent !== 'connection'}
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

