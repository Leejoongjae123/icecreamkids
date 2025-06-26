'use client';

import React, { useEffect, useRef } from 'react';
import { Viewer } from 'hwp.js';

export default function HwpViewer({ filePath }: { filePath: string }) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);

  useEffect(() => {
    async function loadHwpViewer() {
      try {
        if (!viewerContainerRef.current || !filePath) return;

        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        const hwpData = new Uint8Array(arrayBuffer);

        viewerInstance.current = new Viewer(viewerContainerRef.current, hwpData, { type: 'array' });
      } catch (error) {
        console.error('HWP 파일 로딩 중 오류 발생:', error);
      }
    }

    loadHwpViewer();

    return () => {
      if (viewerInstance.current && viewerInstance.current.distory) {
        viewerInstance.current.distory();
      }
    };
  }, [filePath]);

  return (
    <div
      style={{
        flex: 'none',
        width: '100%',
        height: '100%',
      }}
      ref={viewerContainerRef}
    />
  );
}
