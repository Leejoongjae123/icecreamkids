import { RangeCalendar, Select } from '@/components/common';
import { InputText } from '@/components/common/InputText';
import { InputTextarea } from '@/components/common/InputTextarea';
import React, { useState, useEffect, useCallback, useRef, Children, type SetStateAction } from 'react';

// 날짜 기간 타입 정의
interface Period {
  startDate: string;
  endDate: string;
}

// 놀이 계획 섹션 타입 정의
interface LecturePlanSection {
  id: string;
  title: string;
  contents: string;
  lecturePlanCards: any[]; // 실제 타입에 맞게 수정 가능
  // 필요한 다른 속성들 추가
}

// 활동 카드 상태 타입 정의
interface ActivityCardState {
  title: string;
  age: string | number;
  time: string;
  period: Period;
  bodyData: LecturePlanSection[];
  creationType: string;
  indoorType: string;
  activityNames: string;
}

interface ActivityCardDetailBodyProps {
  isEditMode: boolean;
  isReset?: boolean;
  lecturePlanCardSections: any;
  displayTitle: string;
  displayPeriod: string;
  displayAge: string | number;
  displayTime: string;
  originLecturePlanCardSections?: any;
  // 데이터 업데이트를 위한 콜백 함수들 추가
  onTitleChange?: (title: string) => void;
  // onAgeChange?: (age: string | number | Dispatch<SetStateAction<number>>) => void | SetStateAction<number>;
  onAgeChange?: any;
  onTimeChange?: (time: string) => void;
  onPeriodChange?: (period: Period) => void;
  onDataChange?: (data: Partial<ActivityCardState>) => void; // 전체 데이터 업데이트를 위한 콜백
  onResetChange?: () => void;
}

function ActivityCardDetailBody({
  isEditMode,
  isReset = false,
  displayTitle,
  displayPeriod,
  displayAge,
  displayTime,
  lecturePlanCardSections,
  originLecturePlanCardSections,
  onTitleChange,
  onAgeChange,
  onTimeChange,
  onPeriodChange,
  onDataChange,
  onResetChange,
}: ActivityCardDetailBodyProps) {
  // 날짜 데이터 파싱 함수
  const parsePeriod = useCallback((periodString: string): Period => {
    const [startDate = '', endDate = ''] = periodString.split(' ~ ');
    return { startDate, endDate };
  }, []);

  // 초기 상태를 생성하는 함수
  const createInitialState = useCallback((): ActivityCardState => {
    return {
      title: displayTitle,
      age: displayAge,
      time: displayTime,
      period: parsePeriod(displayPeriod),
      bodyData: lecturePlanCardSections?.lecturePlanCardSections || lecturePlanCardSections || [],
      creationType: lecturePlanCardSections?.creationType || '',
      indoorType: lecturePlanCardSections?.indoorType || '',
      activityNames: lecturePlanCardSections?.activityNames || '',
    };
  }, [displayTitle, displayAge, displayTime, displayPeriod, lecturePlanCardSections, parsePeriod]);

  // 단일 상태 객체로 관리
  const [cardState, setCardState] = useState<ActivityCardState>(createInitialState());

  // 개별 상태 접근을 위한 구조 분해 할당
  const { title, age, time, period, bodyData, creationType, indoorType, activityNames } = cardState;

  const playingAgeOption = [
    { value: 2, text: '0-2세' }, // BE에서 0,1,2는 0-2세로 통합
    { value: 3, text: '3세' },
    { value: 4, text: '4세' },
    { value: 5, text: '5세' },
  ];

  const playingTimeOption = [
    { value: '20분', text: '20분' },
    { value: '30분', text: '30분' },
    { value: '60분', text: '60분' },
    { value: '1일', text: '1일' },
  ];

  // 상태 업데이트 유틸리티 함수 - 거기에 부모 콜백 호출 추가
  const updateCardState = useCallback(
    (updates: Partial<ActivityCardState>) => {
      setCardState((prevState) => {
        const newState = { ...prevState, ...updates };
        if (onDataChange) {
          onDataChange(newState);
        }
        return newState;
      });
    },
    [onDataChange],
  );

  // props가 변경될 때만 내부 상태 업데이트 - 단일 상태 업데이트로 리팩토링
  // 이전 한 번만 실행되도록 refs를 사용하여 추적
  const initialRenderRef = useRef(true);

  useEffect(() => {
    // 최초 렌더링 시에만 실행하거나, props가 변경되었을 때 실행
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    // 비교를 통해 변경 사항이 있을 때만 업데이트
    const newState = createInitialState();
    // 긴 너무 길어지는 걸 방지하기 위해 기본 속성만 비교
    if (
      newState.title !== cardState.title ||
      newState.age !== cardState.age ||
      newState.time !== cardState.time ||
      JSON.stringify(newState.period) !== JSON.stringify(cardState.period)
    ) {
      setCardState(newState);
    }
  }, [displayTitle, displayAge, displayTime, displayPeriod, lecturePlanCardSections, createInitialState, cardState]);

  // 제목 변경 핸들러
  const handleTitleChange = useCallback(
    (value: string) => {
      updateCardState({ title: value });
      if (onTitleChange) onTitleChange(value);
    },
    [updateCardState, onTitleChange],
  );

  // 연령 변경 핸들러
  const handleAgeChange = useCallback(
    (value: string | number) => {
      updateCardState({ age: value });
      if (onAgeChange) onAgeChange(value);
    },
    [updateCardState, onAgeChange],
  );

  // 시간 변경 핸들러
  const handleTimeChange = useCallback(
    (value: string) => {
      updateCardState({ time: value });
      if (onTimeChange) onTimeChange(value);
    },
    [updateCardState, onTimeChange],
  );

  // 기간 변경 핸들러
  const handleDateChange = useCallback(
    (key: string, value: string) => {
      console.log('[DEBUG] ActivityCardDetailBody에서 날짜 올려유:', key, value);
      const newPeriod = { ...period, [key]: value };
      updateCardState({ period: newPeriod });
      if (onPeriodChange) onPeriodChange(newPeriod);
    },
    [period, updateCardState, onPeriodChange],
  );
  // 섹션 데이터 업데이트 핸들러
  const handleInputChange = useCallback(
    (sectionIndex: number, field: string, value: string) => {
      const updatedData = bodyData.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section,
      );

      updateCardState({ bodyData: updatedData });
    },
    [bodyData, updateCardState],
  );

  // 카드 데이터 업데이트 핸들러
  const handleCardInputChange = useCallback(
    (sectionIndex: number, cardIndex: number, field: string, value: string) => {
      const updatedData = bodyData.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              lecturePlanCards: section.lecturePlanCards.map((card, cIndex) =>
                cIndex === cardIndex ? { ...card, [field]: value } : card,
              ),
            }
          : section,
      );

      updateCardState({ bodyData: updatedData });
    },
    [bodyData, updateCardState],
  );

  // 줄바꿈 처리 함수
  const applyingLineFeed = (data: string, type?: 'contents' | 'subContents') => {
    if (!data) return null;

    return data.split('\n').map((rowText, index) => {
      // 콘텐츠 타입에 따른 추가 클래스 결정
      const typeClasses = type === 'subContents' ? 'font-small' : 'font-medium';

      // 번호가 맨 앞에 붙어 있는 경우
      const hasNumberPrefix = /^(\d+)\.\s/.test(rowText); // 숫자. (예: "1. ")로 시작하는지 확인

      if (hasNumberPrefix) {
        // 숫자 부분 추출
        const match = rowText.match(/^(\d+)\.\s/);
        const number = match ? match[1] : '';

        // 숫자와 점(.) 이후 내용만 추출
        const content = rowText.replace(/^\d+\.\s/, '');

        return (
          <p className={`list-content ${typeClasses}`} key={`${rowText}-${content}-${number}`}>
            <span className="bullet">{number}.</span>
            {content}
          </p>
        );
      }

      // 번호가 없는 경우
      const pKey = `${index}-${rowText}-${typeClasses}`;
      return (
        <p className={`list-content ${typeClasses}`} key={pKey}>
          {rowText}
        </p>
      );
    });
  };

  // 초기화
  useEffect(() => {
    if (isReset) {
      if (originLecturePlanCardSections) {
        updateCardState(originLecturePlanCardSections);
        onResetChange?.();
      }
    }
  }, [isReset, onResetChange, originLecturePlanCardSections, updateCardState]);

  // 수정모드일 때 보여줄 컴포넌트
  const EditMode = (
    <>
      <div className="body-content subject-content">
        <div className="wrap-content">
          <InputText id="display-title" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
        <div className="wrap-content">
          <table className="item-table type-vertical">
            <caption className="ir_caption">놀이 계획안 정보 테이블</caption>
            <colgroup>
              <col style={{ width: '140px' }} />
              <col />
              <col style={{ width: '140px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">놀이기간</th>
                <td colSpan={3}>
                  <RangeCalendar value={period} onChange={handleDateChange} />
                </td>
              </tr>
              <tr>
                <th scope="row">놀이연령</th>
                <td>
                  <Select
                    size="small"
                    options={playingAgeOption}
                    value={age}
                    onChange={(value) => handleAgeChange(value as number)}
                  />
                  {/* <InputText id="display-age" value={age} onChange={(e) => handleAgeChange(e.target.value)} /> */}
                </td>
                <th scope="row">놀이시간</th>
                <td>
                  <Select
                    size="small"
                    options={playingTimeOption}
                    value={time}
                    onChange={(value) => handleTimeChange(value as string)}
                  />
                  {/* <InputText id="display-time" value={time} onChange={(e) => handleTimeChange(e.target.value)} /> */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="body-content detail-content">
        {Array.isArray(bodyData) &&
          Children.toArray(
            bodyData.map((section: any, sectionIndex: number) => (
              <div className="wrap-content">
                {/* 섹션 타이틀 */}
                <div className="tit-content">
                  <InputText
                    id={`section-title-${sectionIndex}`}
                    value={section?.title || ''}
                    onChange={(e) => handleInputChange(sectionIndex, 'title', e.target.value)}
                  />
                </div>
                {/* 섹션 내 카드 리스트 */}
                <div className="group-form type-vertical2">
                  {section.lecturePlanCards?.map((card: any, cardIndex: number) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={`card_edit-fragment-${sectionIndex}-${section.id}-${card.id}-${cardIndex}`}>
                      <div className="fieldset-form form-title">
                        {/* 카드 타이틀 */}
                        <InputTextarea
                          id={`card-title-${sectionIndex}-${cardIndex}`}
                          value={card.title || ''}
                          placeholder="카드 제목 입력"
                          maxLength={50}
                          onChange={(value) => handleCardInputChange(sectionIndex, cardIndex, 'title', value)}
                        />
                      </div>
                      <div className="fieldset-form form-sub">
                        {/* 카드 컨텐츠 */}
                        <InputTextarea
                          id={`card-contents-${sectionIndex}-${cardIndex}`}
                          value={card.contents || ''}
                          placeholder="카드 내용 입력"
                          maxLength={300}
                          onChange={(value) => handleCardInputChange(sectionIndex, cardIndex, 'contents', value)}
                        />
                      </div>
                      <div className="fieldset-form form-contents">
                        {/* 카드 서브컨텐츠 */}
                        <InputTextarea
                          id={`card-subContents-${sectionIndex}-${cardIndex}`}
                          value={card.subContents || ''}
                          placeholder="카드 서브컨텐츠 입력"
                          maxLength={200}
                          onChange={(value) => handleCardInputChange(sectionIndex, cardIndex, 'subContents', value)}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )),
          )}
      </div>
    </>
  );

  // 조회모드일 때 보여줄 컴포넌트
  const ViewMode = (
    <div id="activity-card-printing-area">
      {/* 타이틀 영역 */}
      <div className="body-content subject-content">
        {/* 타이틀 영역 > 타이틀 */}
        <div className="wrap-content">
          <div className="tit-content">
            <strong className="txt-tit">{title}</strong>
          </div>
        </div>
        {/* 타이틀 영역 > 정보  */}
        <div className="wrap-content">
          <table className="item-table type-vertical">
            <caption className="ir_caption">놀이 계획안 정보 테이블</caption>
            <colgroup>
              <col style={{ width: '140px' }} />
              <col />
              <col style={{ width: '140px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">놀이기간</th>
                <td colSpan={3}>{displayPeriod && `${period.startDate} ~ ${period.endDate}`}</td>
              </tr>
              <tr>
                <th scope="row">놀이연령</th>
                <td>{displayPeriod && `${age === 2 ? '0~2' : age}세`}</td>
                <th scope="row">놀이시간</th>
                <td>{displayPeriod && time}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="body-content detail-content">
        {Array.isArray(bodyData) &&
          bodyData.map((section: any, sectionIndex: number) => (
            <div key={section.sectionKey} className="wrap-content">
              {/* 섹션 타이틀 */}
              <div className="tit-content">
                <strong className="txt-tit">{section?.title || '제목 없음'}</strong>
              </div>
              {/* 섹션 내 카드 리스트 */}
              <ul>
                {section.lecturePlanCards && section.lecturePlanCards.length > 0 ? (
                  section.lecturePlanCards.map((card: any, cardIndex: number) => (
                    <div key={card.id || `card-${cardIndex}-${sectionIndex}`}>
                      {/* 타이틀 영역 */}
                      {card.title && <li className="txt-content font-bold">{card.title}</li>}
                      {/* 컨텐츠 영역 */}
                      {card.contents && applyingLineFeed(card.contents, 'contents')}
                      {/* 여기 밑에 서브컨텐츠 */}
                      {/* 서브컨텐츠 영역 */}
                      {card.subContents && applyingLineFeed(card.subContents, 'subContents')}
                    </div>
                  ))
                ) : (
                  <li>내용이 존재하지 않습니다.</li> // lecturePlanCards가 빈 배열일 경우
                )}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );

  if (isEditMode) return EditMode;
  return ViewMode;
  // return isEditMode ? EditMode : ViewMode;
}

export default ActivityCardDetailBody;
