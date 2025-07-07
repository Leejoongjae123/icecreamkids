'use client';

import React, {useEffect, useRef} from 'react';
import {Viewer} from 'hwp.js';

export default function HwpViewer({ filePath, downloadHandler}: { filePath: string, downloadHandler:() => void }) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  var lastHwpPath = "";
  useEffect(() => {
    async function loadHwpViewer() {
      try {
        if (!viewerContainerRef.current || !filePath) return;

        if(lastHwpPath != filePath){
          lastHwpPath = filePath;

          const response = await fetch(filePath);
          const arrayBuffer = await response.arrayBuffer();
          const hwpData = new Uint8Array(arrayBuffer);

          // console.log(`load hwp : `,filePath);
          viewerInstance.current = new Viewer(viewerContainerRef.current, hwpData, { type: 'array' });
          var headerControls = document.getElementsByClassName("hwpjs-header-control")
          for(var i=0 ; i < headerControls.length ; i++){
            headerControls[i].setAttribute("hidden", "");
          }
          // headerControl.setAttribute("hidden", true);
        }

      } catch (error) {
        console.error('HWP 파일 로딩 중 오류 발생:', error);
        lastHwpPath = "";

        let div = document.createElement("div");
        div.className = "item-content";
        let em = document.createElement("em");
        em.className = "tit-item";
        em.setHTMLUnsafe("이 자료는 미리보기가 지원되지 않습니다.");
        div.appendChild(em);

        let p = document.createElement("p");
        p.className = "txt-item";
        p.setHTMLUnsafe("이 자료는 미리보기가 지원되지 않아요.<br>다운로드로 확인해 주세요.")
        div.appendChild(p);

        let btn = document.createElement("button");
        btn.className = "btn btn-small btn-line";
        btn.setHTMLUnsafe("다운로드");
        btn.onclick = downloadHandler;
        div.appendChild(btn);
        document.getElementById("hwpViewer")?.parentElement?.appendChild(div)
        document.getElementById("hwpViewer")?.remove()
      }
    }

    // console.log(`call load hwp : `, filePath);
    loadHwpViewer();

    return () => {
      if (viewerInstance.current && viewerInstance.current.distory) {
        viewerInstance.current.distory();
      }
    };
  }, [filePath]);

  // console.log(`call lastHwpPath : `, lastHwpPath);
  return (
      <div id="hwpViewer"
           style={{
            flex: 'none',
            width: '100%',
            height: '100%',
          }}
          ref={viewerContainerRef}
      />
  );

}
