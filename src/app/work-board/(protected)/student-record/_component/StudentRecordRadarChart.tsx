'use client';

import { RadarChart, PolarGrid, PolarRadiusAxis, Radar } from 'recharts';
import { RadarChartData } from '@/components/modal/student-record-indicators/types';
import { useMemo } from 'react';

interface RadarChartProps {
  data: RadarChartData[];
  onChangeGraphData?: (domainCode: string, newValue: number) => void;
}

const StudentRecordRadarChart = ({ data, onChangeGraphData }: RadarChartProps) => {
  const pointButtons = useMemo(() => {
    return data.map((item, index) => {
      const radius = 450;
      const angle = (index / data.length) * Math.PI * 2;
      const xOffset = Math.cos(angle - Math.PI / 2) * radius * 0.5;
      const yOffset = Math.sin(angle - Math.PI / 2) * radius * 0.4;
      return {
        id: item.id,
        subject: item.subject,
        top: `calc(50% + ${yOffset - 10}px)`,
        left: `calc(50% + ${xOffset}px)`,
      };
    });
  }, [data]);

  const handleSliderChange = (id: string, newValue: number) => {
    onChangeGraphData?.(id, newValue); // 부모로 단일 변경 이벤트 보냄
  };

  const handleClickChangeButton = (id: string, delta: number) => {
    const currentItem = data.filter((item) => id === item.id)[0];
    const newValue = Math.max(1, Math.min(5, currentItem.value + delta));

    onChangeGraphData?.(id, newValue);
  };

  return (
    <div
      className="area-graph"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto',
        whiteSpace: 'nowrap',
      }}
    >
      <RadarChart data={data} width={571} height={383}>
        {/* 개별 삼각형 단위로 그라데이션 적용 */}
        <defs>
          {data.map((item) => (
            <pattern id={`pattern-${item.id}`} key={item.id} patternUnits="userSpaceOnUse" width="100%" height="100%">
              <image href={`${item.image}`} x="0%" y="-5.4%" width="100%" height="100%" />
            </pattern>
          ))}
        </defs>
        {/* 내부 수치선 및 축 강조 */}
        <PolarGrid stroke="#EAEAEA" strokeWidth={1} />
        <PolarRadiusAxis
          angle={18}
          domain={[0, 5]}
          tick={false}
          tickLine={false}
          axisLine={false}
          scale="linear"
          ticks={[1, 2, 3, 4, 5] as any} // 명시적으로 지정
        />
        {/*  각 항목마다 개별적인 색상 적용 */}
        {data.map((item) => (
          <Radar
            key={item.id}
            name={item.subject}
            dataKey="value"
            stroke="none"
            fill={`url(#pattern-${item.id})`}
            fillOpacity={0.3}
            animationDuration={0}
          />
        ))}
      </RadarChart>
      {data.map((item, index) => {
        const angle = (index / data.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `161px`,
              height: '1px',
              transformOrigin: 'left center',
              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
            }}
          >
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={item.value}
              onChange={(e) => {
                const newValue = Math.max(1, parseFloat(e.target.value));
                handleSliderChange(item.id, newValue);
              }}
              style={{
                width: '100%',
                position: 'absolute',
                top: '50%',
                left: '-4%',
                transform: 'translateY(-50%)',
                WebkitAppearance: 'none',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                opacity: '1',
                caretColor: 'transparent',
              }}
            />
            <style jsx>{`
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 12px; /* 슬라이더 점 크기 */
                height: 12px; /* 슬라이더 점 크기 */
                background-color: ${item.color};
                border: 2px solid #ffffff;
                border-radius: 50%;
                cursor: pointer;
              }

              input[type='range']::-moz-range-thumb {
                width: 12px; /* 슬라이더 점 크기 */
                height: 12px; /* 슬라이더 점 크기 */
                background-color: ${item.color};
                border: 2px solid #ffffff;
                border-radius: 50%;
                cursor: pointer;
              }
            `}</style>
          </div>
        );
      })}
      {/* 라벨과 버튼 UI */}
      {pointButtons.map((button, index) => (
        <div key={button.id} className="point-graph" style={{ top: button.top, left: button.left }}>
          <button type="button" className="btn-graph" onClick={() => handleClickChangeButton(button.id, -1)}>
            <span className="ico-comm ico-minus-16" />
          </button>
          <span className={`txt-point type-color${index + 1}`}>{button.subject}</span>
          <button type="button" className="btn-graph" onClick={() => handleClickChangeButton(button.id, 1)}>
            <span className="ico-comm ico-plus-16" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default StudentRecordRadarChart;
