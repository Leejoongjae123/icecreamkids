import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedDataStore, SavedReportData, ReportType, StickerItem, TextStickerItem, GridItem, ReportBottomData } from '@/app/work-board/(protected)/report/comnponents/types';

export const useSavedDataStore = create<SavedDataStore>()(
  persist(
    (set, get) => ({
      savedReports: [],
      currentSavedData: null,
      isSaved: false,

      saveCurrentReport: (
        reportType: ReportType,
        subject: number,
        stickers: StickerItem[],
        textStickers: TextStickerItem[],
        title?: string,
        description?: string,
        // 추가 파라미터들
        searchParams?: Record<string, string>,
        gridLayout?: GridItem[],
        gridContents?: Record<string, any>,
        reportBottomData?: ReportBottomData,
        backgroundImageUrl?: string,
        imagePositionsMap?: Record<string, any[]>
      ) => {
        const newReport: SavedReportData = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reportType,
          subject,
          stickers: [...stickers], // 깊은 복사
          textStickers: [...textStickers], // 깊은 복사
          savedAt: new Date().toISOString(),
          title: title || `${reportType}형 리포트 - ${new Date().toLocaleDateString()}`,
          description,
          // 추가된 필드들
          searchParams: searchParams ? { ...searchParams } : undefined,
          gridLayout: gridLayout ? [...gridLayout] : undefined,
          gridContents: gridContents ? { ...gridContents } : undefined,
          reportBottomData: reportBottomData ? { ...reportBottomData } : undefined,
          backgroundImageUrl,
          imagePositionsMap: imagePositionsMap ? { ...imagePositionsMap } : undefined,
        };

        set((state) => ({
          savedReports: [...state.savedReports, newReport],
          currentSavedData: newReport,
        }));

        return newReport.id;
      },

      loadSavedReport: (id: string) => {
        const { savedReports } = get();
        const report = savedReports.find((report) => report.id === id);
        
        if (report) {
          set({ currentSavedData: report });
          return report;
        }
        
        return null;
      },

      deleteSavedReport: (id: string) => {
        set((state) => ({
          savedReports: state.savedReports.filter((report) => report.id !== id),
          currentSavedData: state.currentSavedData?.id === id ? null : state.currentSavedData,
        }));
      },

      updateSavedReport: (id: string, updates: Partial<SavedReportData>) => {
        set((state) => ({
          savedReports: state.savedReports.map((report) =>
            report.id === id ? { ...report, ...updates } : report
          ),
          currentSavedData: state.currentSavedData?.id === id 
            ? { ...state.currentSavedData, ...updates } 
            : state.currentSavedData,
        }));
      },

      setCurrentSavedData: (data: SavedReportData | null) => {
        set({ currentSavedData: data });
      },

      getAllSavedReports: () => {
        return get().savedReports;
      },

      setSaved: (saved: boolean) => {
        set({ isSaved: saved });
      },

      exportToArticleDataFile: (reportData: SavedReportData) => {
        try {
          // JavaScript 객체를 보기 좋게 포맷팅된 문자열로 변환
          const formatData = (data: any, indent = 0): string => {
            const spaces = '  '.repeat(indent);
            
            if (data === null || data === undefined) {
              return 'null';
            }
            
            if (typeof data === 'string') {
              return `"${data.replace(/"/g, '\\"')}"`;
            }
            
            if (typeof data === 'number' || typeof data === 'boolean') {
              return String(data);
            }
            
            if (Array.isArray(data)) {
              if (data.length === 0) return '[]';
              const items = data.map(item => `${spaces}  ${formatData(item, indent + 1)}`).join(',\n');
              return `[\n${items}\n${spaces}]`;
            }
            
            if (typeof data === 'object') {
              const entries = Object.entries(data);
              if (entries.length === 0) return '{}';
              const items = entries.map(([key, value]) => 
                `${spaces}  ${key}: ${formatData(value, indent + 1)}`
              ).join(',\n');
              return `{\n${items}\n${spaces}}`;
            }
            
            return String(data);
          };

          // articleData.js 파일 내용 생성
          const fileContent = `// 놀이기록 저장 데이터
// 생성일시: ${new Date().toLocaleString('ko-KR')}
// 리포트 ID: ${reportData.id}

const articleData = ${formatData(reportData)};

export default articleData;

// 데이터 구조 설명:
// - id: 고유 식별자
// - reportType: 리포트 타입 (A, B, C)
// - subject: 주제 개수
// - stickers: 꾸미기 스티커 정보 (위치, 크기, 회전각도 포함)
// - textStickers: 텍스트 스티커 정보
// - searchParams: URL 파라미터들
// - gridLayout: 그리드 배치 정보
// - gridContents: 그리드별 내용 데이터
// - reportBottomData: 하단 텍스트 영역 데이터
// - backgroundImageUrl: 배경 이미지 URL
// - imagePositionsMap: 이미지 위치 정보
// - savedAt: 저장 일시
// - title: 제목
// - description: 설명
`;

          // 파일 다운로드
          const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          
          // 파일명 생성 (날짜 + 시간 포함)
          const now = new Date();
          const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
          const fileName = `articleData_${reportData.reportType}_${dateString}.js`;
          
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // URL 객체 해제
          URL.revokeObjectURL(url);
          
          console.log(`articleData.js 파일이 생성되었습니다: ${fileName}`);
        } catch (error) {
          console.error('articleData.js 파일 생성 중 오류 발생:', error);
          alert('파일 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      },
    }),
    {
      name: 'saved-report-data', // localStorage에 저장될 키 이름
      version: 1,
    }
  )
);
