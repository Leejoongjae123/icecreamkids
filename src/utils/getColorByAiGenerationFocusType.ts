/**
 * * AI 생성 초점 타입에 따른 색상을 반환하는 함수
 * @param aiGenerationFocusType AI 생성 초점 타입
 * @returns 색상 클래스명
 */

const AI_GENERATION_FOCUS_TYPE = {
  TYPE_A: 'TYPE_A',
  TYPE_B: 'TYPE_B',
  TYPE_C: 'TYPE_C',
};

const STYLING_CLASSES = {
  TYPE_A: 'inner-card', // 노랑
  TYPE_B: 'inner-card card-type02', // 보라
  TYPE_C: 'inner-card card-type03', // 분홍
};

type AiGenerationFocusType = (typeof AI_GENERATION_FOCUS_TYPE)[keyof typeof AI_GENERATION_FOCUS_TYPE];

export default function getColorByAiGenerationFocusType(aiGenerationFocusType: AiGenerationFocusType): string {
  const stylingMap: Record<AiGenerationFocusType, string> = {
    [AI_GENERATION_FOCUS_TYPE.TYPE_A]: STYLING_CLASSES.TYPE_A,
    [AI_GENERATION_FOCUS_TYPE.TYPE_B]: STYLING_CLASSES.TYPE_B,
    [AI_GENERATION_FOCUS_TYPE.TYPE_C]: STYLING_CLASSES.TYPE_C,
  };

  return stylingMap[aiGenerationFocusType];
}
