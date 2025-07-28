"use client";
import React, { useRef, useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { StickerItem } from './types';
import { useStickerStore } from '@/hooks/store/useStickerStore';
import { cn } from '@/lib/utils';

interface DraggableStickerProps {
  sticker: StickerItem;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ sticker, containerRef }) => {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const { updateStickerPosition, removeSticker, bringToFront } = useStickerStore();



  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !stickerRef.current) return;

    bringToFront(sticker.id);
    setIsSelected(true);
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    setInitialPosition(sticker.position);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
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
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, initialPosition]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleContainerClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleContainerClick);
    };
  }, [isSelected]);

  // 스타일 객체
  const stickerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${sticker.position.x}px`,
    top: `${sticker.position.y}px`,
    width: `${sticker.size.width}px`,
    height: `${sticker.size.height}px`,
    transform: `rotate(${sticker.rotation}deg)`,
    zIndex: sticker.zIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    pointerEvents: 'auto',
    outline: isSelected ? '2px solid #fbbf24' : 'none',
    outlineOffset: '2px',
    transition: isDragging ? 'none' : 'all 0.2s ease',
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
      
      {/* 선택된 상태일 때 삭제 버튼 */}
      {isSelected && (
        <button 
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600"
          style={{ zIndex: sticker.zIndex + 1 }}
          onClick={(e) => {
            e.stopPropagation();
            removeSticker(sticker.id);
          }}
          title="스티커 삭제"
        >
          <IoClose
            className="bg-white border border-gray-200 rounded-full"
            size={16}
          />
        </button>
      )}
    </div>
  );
};

export default DraggableSticker; 