import React, { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
// PDF.js의 현재 버전에 맞춰 CDN의 워커 URL을 설정합니다.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPage, setNumPages] = useState<number>(0); // 총 페이지수
  // options 객체를 useMemo로 메모이제이션
  const documentOptions = useMemo(() => ({ disableStream: true }), []);

  // PDF 파일이 로드되었을 때 호출되는 콜백
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="pdf-viewer">
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} options={documentOptions} loading={null}>
        {Array.from({ length: numPage }, (_, index) => (
          <div key={`page_${index + 1}`} style={{ display: 'flex', justifyContent: 'center' }}>
            <Page
              pageNumber={index + 1}
              scale={1} // 기본 스케일
              loading={null}
            />
          </div>
        ))}
        {/* <Page scale={pageScale} pageNumber={pageNumber} loading={<span>페이지 로딩 중...</span>} /> */}
      </Document>
    </div>
  );
};

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;
