"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { IoClose, IoRefresh } from "react-icons/io5";
import { StickerItem } from './types';
import { useStickerStore } from '@/hooks/store/useStickerStore';
import { cn } from '@/lib/utils';

interface DraggableStickerProps {
  sticker: StickerItem;
  containerRef: React.RefObject<HTMLDivElement>;
}

// 리사이즈 핸들 타입 정의
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

const DraggableSticker: React.FC<DraggableStickerProps> = ({ sticker, containerRef }) => {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  // 리사이즈 관련 상태
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialStickerState, setInitialStickerState] = useState({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    rotation: 0
  });

  // 회전 관련 상태
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState(0);

  const { updateStickerPosition, updateStickerSize, updateStickerRotation, removeSticker, bringToFront } = useStickerStore();



  // 리사이즈 핸들 마우스 다운 이벤트
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) {
      return;
    }
    
    if (handle === 'rotate') {
      setIsRotating(true);
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = sticker.position.x + sticker.size.width / 2;
      const centerY = sticker.position.y + sticker.size.height / 2;
      setRotationStart({ 
        x: e.clientX - containerRect.left - centerX, 
        y: e.clientY - containerRect.top - centerY 
      });
      setInitialRotation(sticker.rotation);
    } else {
      setIsResizing(true);
      setResizeHandle(handle);
      const containerRect = containerRef.current.getBoundingClientRect();
      setResizeStart({ 
        x: e.clientX - containerRect.left, 
        y: e.clientY - containerRect.top 
      });
      setInitialStickerState({
        position: sticker.position,
        size: sticker.size,
        rotation: sticker.rotation
      });
    }
    
    bringToFront(sticker.id);
    setIsSelected(true);
  }, [sticker, containerRef, bringToFront]);

  // 스티커 본체 마우스 다운 이벤트 (드래그용)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !stickerRef.current) {
      return;
    }

    bringToFront(sticker.id);
    setIsSelected(true);
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    setInitialPosition(sticker.position);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    if (isDragging) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      const newX = initialPosition.x + deltaX;
      const newY = initialPosition.y + deltaY;
      
      // 컨테이너 경계 체크
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      
      const clampedX = Math.max(0, Math.min(newX, containerWidth - sticker.size.width));
      const clampedY = Math.max(0, Math.min(newY, containerHeight - sticker.size.height));
      
      updateStickerPosition(sticker.id, { x: clampedX, y: clampedY });
    } else if (isResizing && resizeHandle) {
      handleResize(mouseX, mouseY);
    } else if (isRotating) {
      handleRotation(mouseX, mouseY);
    }
  }, [isDragging, isResizing, isRotating, dragStart, initialPosition, resizeHandle, sticker, containerRef, updateStickerPosition]);

  // 리사이즈 처리 함수
  const handleResize = useCallback((mouseX: number, mouseY: number) => {
    if (!resizeHandle) {
      return;
    }

    const deltaX = mouseX - resizeStart.x;
    const deltaY = mouseY - resizeStart.y;
    
    let newWidth = initialStickerState.size.width;
    let newHeight = initialStickerState.size.height;
    let newX = initialStickerState.position.x;
    let newY = initialStickerState.position.y;

    const minSize = 20; // 최소 크기

    switch (resizeHandle) {
      case 'nw': // 북서쪽
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'n': // 북쪽
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'ne': // 북동쪽
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'e': // 동쪽
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        break;
      case 'se': // 남동쪽
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        break;
      case 's': // 남쪽
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        break;
      case 'sw': // 남서쪽
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        break;
      case 'w': // 서쪽
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        break;
    }

    updateStickerSize(sticker.id, { width: newWidth, height: newHeight });
    updateStickerPosition(sticker.id, { x: newX, y: newY });
  }, [resizeHandle, resizeStart, initialStickerState, sticker.id, updateStickerSize, updateStickerPosition]);

  // 회전 처리 함수
  const handleRotation = useCallback((mouseX: number, mouseY: number) => {
    const centerX = sticker.position.x + sticker.size.width / 2;
    const centerY = sticker.position.y + sticker.size.height / 2;
    
    const currentX = mouseX - centerX;
    const currentY = mouseY - centerY;
    
    const initialAngle = Math.atan2(rotationStart.y, rotationStart.x);
    const currentAngle = Math.atan2(currentY, currentX);
    
    const deltaAngle = (currentAngle - initialAngle) * (180 / Math.PI);
    const newRotation = (initialRotation + deltaAngle) % 360;
    
    updateStickerRotation(sticker.id, newRotation);
  }, [sticker, rotationStart, initialRotation, updateStickerRotation]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle(null);
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isSelected && e.key === 'Delete') {
      removeSticker(sticker.id);
    }
  };

  const handleContainerClick = (e: Event) => {
    if (stickerRef.current && !stickerRef.current.contains(e.target as Node)) {
      setIsSelected(false);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleContainerClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleContainerClick);
    };
  }, [isSelected]);

  // 리사이즈 핸들 렌더링 함수
  const renderResizeHandles = () => {
    if (!isSelected) {
      return null;
    }

    const handleSize = 7;
    const handles: { position: ResizeHandle; x: number; y: number; cursor: string }[] = [
      { position: 'nw', x: -handleSize/2, y: -handleSize/2, cursor: 'nw-resize' },
      { position: 'n', x: sticker.size.width/2 - handleSize/2, y: -handleSize/2, cursor: 'n-resize' },
      { position: 'ne', x: sticker.size.width - handleSize/2, y: -handleSize/2, cursor: 'ne-resize' },
      { position: 'e', x: sticker.size.width - handleSize/2, y: sticker.size.height/2 - handleSize/2, cursor: 'e-resize' },
      { position: 'se', x: sticker.size.width - handleSize/2, y: sticker.size.height - handleSize/2, cursor: 'se-resize' },
      { position: 's', x: sticker.size.width/2 - handleSize/2, y: sticker.size.height - handleSize/2, cursor: 's-resize' },
      { position: 'sw', x: -handleSize/2, y: sticker.size.height - handleSize/2, cursor: 'sw-resize' },
      { position: 'w', x: -handleSize/2, y: sticker.size.height/2 - handleSize/2, cursor: 'w-resize' },
    ];

    return handles.map((handle) => (
      <div
        key={handle.position}
        className="absolute bg-white border-2 border-blue-500 rounded-full z-10"
        style={{
          left: `${handle.x}px`,
          top: `${handle.y}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          cursor: handle.cursor,
          zIndex: sticker.zIndex + 2,
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
      />
    ));
  };

  // 회전 핸들 렌더링 함수
  const renderRotateHandle = () => {
    if (!isSelected) {
      return null;
    }

    const handleSize = 20;
    const offsetY = 10; // 스티커 하단에서 거리

    return (
      <div
        className="absolute bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-50 z-10"
        style={{
          left: `${sticker.size.width/2 - handleSize/2}px`,
          top: `${sticker.size.height + offsetY}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          zIndex: sticker.zIndex + 2,
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'rotate')}
        title="회전"
      >
        <IoRefresh size={12} className="text-blue-500" />
      </div>
    );
  };

  // 스타일 객체
  const stickerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${sticker.position.x}px`,
    top: `${sticker.position.y}px`,
    width: `${sticker.size.width}px`,
    height: `${sticker.size.height}px`,
    transform: `rotate(${sticker.rotation}deg)`,
    zIndex: sticker.zIndex,
    cursor: isDragging || isResizing || isRotating ? 'grabbing' : (isSelected ? 'move' : 'grab'),
    userSelect: 'none',
    pointerEvents: 'auto',
    // 점선 바운더리 (선택된 상태일 때만)
    border: isSelected ? '2px dashed #3D8BFF' : 'none',
    transition: (isDragging || isResizing || isRotating) ? 'none' : 'all 0.2s ease',
    // 투명도 제거 - 항상 선명하게
    opacity: 1,
    // 배경색 완전 제거
    backgroundColor: 'transparent',
  };

  return (
    <div
      ref={stickerRef}
      style={stickerStyle}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
        bringToFront(sticker.id);
      }}
    >
      {/* 스티커 이미지 */}
      <img
        src={sticker.url}
        alt={`스티커 ${sticker.stickerIndex + 1}`}
        style={{
          width: '100%',
          height: '100%',
          // object-fit을 contain으로 설정하여 스티커 전체가 보이도록 함
          objectFit: 'contain',
          // 완전 투명 배경
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'block',
          // PNG 투명도 보존
          mixBlendMode: 'normal',
        }}
        draggable={false}
        onError={(e) => {
          // 이미지 로드 실패시 대체 콘텐츠 표시
          e.currentTarget.style.display = 'none';
        }}
        onLoad={(e) => {
          // 이미지 로드 성공시 배경 완전 제거
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      />
      
      {/* 이미지 로드 실패시 대체 콘텐츠 - 투명 배경으로 수정 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          fontSize: '12px',
          color: '#666',
          pointerEvents: 'none',
          // 기본적으로 숨김 - 이미지 로드 실패시에만 표시
          opacity: 0,
        }}
      >
        스티커 {sticker.stickerIndex + 1}
      </div>
      
      {/* 리사이즈 핸들들 */}
      {renderResizeHandles()}
      
      {/* 회전 핸들 */}
      {renderRotateHandle()}
      
      {/* 선택된 상태일 때 삭제 버튼 */}
      {isSelected && (
        <button 
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-white border-2 border-zinc-200 hover:bg-zinc-100 text-black"
          style={{ zIndex: sticker.zIndex + 3 }}
          onClick={(e) => {
            e.stopPropagation();
            removeSticker(sticker.id);
          }}
          title="스티커 삭제"
        >
          <IoClose size={12} />
        </button>
      )}
    </div>
  );
};

export default DraggableSticker; 