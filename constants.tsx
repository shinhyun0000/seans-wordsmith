import { LengthConfig, StepConfig, CharTarget } from './types.ts';

export const SYSTEM_PROMPT = `당신은 'Sean's WordSmith'의 편집국장입니다. 전문 기자의 문체(~했다, ~이다)를 엄격히 준수합니다.

[데이터 정확성 지침]
1. 주가, 환율, 통계 수치, 날짜 등 구체적인 숫자 데이터를 인용할 때는 반드시 Google Search 결과를 기반으로 최신 정보를 사용하라.
2. 검색으로 확인할 수 없는 수치는 "[팩트체크 필요]" 태그를 붙여 표시하라.
3. 학습 데이터에만 의존한 추정치를 확정적 사실처럼 기술하지 마라.
4. 오늘 날짜를 기준으로 가장 최신의 정보를 반영하라.`;

export const LENGTH_CONFIG: Record<string, LengthConfig> = {
  BRIEF: { label: '1,000자 내외 (단신/속보)', description: '핵심 정보와 신속한 전달' },
  SHORT: { label: '2,000~3,000자 (심층 보도)', description: '핵심 쟁점과 분석 중심' },
  MEDIUM: { label: '3,000~5,000자 (기획 연재)', description: '다양한 인터뷰와 데이터 포함' },
  LONG: { label: '5,000자 이상 (대하 르포)', description: '역사적 배경부터 미래 전망까지 망라' }
};

export const LENGTH_TARGET_CHARS: Record<string, CharTarget> = {
  BRIEF:  { min: 800,  max: 1200 },
  SHORT:  { min: 1800, max: 3200 },
  MEDIUM: { min: 2800, max: 5200 },
  LONG:   { min: 4800, max: 6000 },
};

export const STEPS_CONFIG: StepConfig[] = [
  {
    type: 'TOPIC',
    name: 'Topic Smith',
    description: '뉴스 가치 분석 및 기사 방향 확정',
    prompt: '제시된 아이디어를 신문 기사의 "스트레이트 뉴스" 관점에서 가치를 분석하고, 기사의 핵심 리드문(초안) 3문장을 작성하세요.'
  },
  {
    type: 'ANGLE',
    name: 'Angle Smith',
    description: '독보적인 보도 관점(Angle) 설정',
    prompt: '앞 단계에서 확정된 리드문을 바탕으로, 기사의 깊이를 더할 3가지 심층 취재 관점을 제시하세요. 중복된 설명은 피하고 새로운 정보를 추가하세요.'
  },
  {
    type: 'READER',
    name: 'Reader Smith',
    description: '전문 용어 해설 및 배경 지식 보강',
    prompt: '현재까지의 논의 흐름에서 일반 독자가 생소해할 용어 3-5개를 선정하여 풀이하고, 기사에 힘을 실어줄 통계나 배경 지식을 제안하세요.'
  },
  {
    type: 'STRUCTURE',
    name: 'Structure Smith',
    description: '전체 기사 구성안 및 소제목 설계',
    prompt: '선택된 분량에 맞춰 기사의 [서론-본론1-본론2-본론3-결론] 구조를 설계하고 각 문단의 핵심 내용을 요약하세요. 제목은 [A: B] 구조로 제시하세요.'
  },
  {
    type: 'DRAFT',
    name: 'Draft Smith',
    description: '본문 집중 집필 (설계도 기반)',
    prompt: '앞서 설계된 구조와 관점을 통합하여 실제 기사 본문을 상세히 작성하세요. 선택된 목표 분량을 채울 수 있도록 풍부한 묘사와 분석을 담으세요.'
  },
  {
    type: 'FINAL',
    name: 'Final Check',
    description: '최종 퇴고 및 팩트 체크 문장 다듬기',
    prompt: '전체 기사의 논리적 흐름을 점검하고, 기자의 시각에서 가장 날카로운 문장으로 최종 다듬기를 수행하세요.'
  }
];
