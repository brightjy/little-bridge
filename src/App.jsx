import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Settings, 
  Heart, 
  MessageCircle, 
  AlertCircle, 
  RefreshCw, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Compass,
  Baby,
  Key,
  Clock,
  Sparkle,
  Mic,
  Headphones,
  Smartphone,
  Bookmark,
  Home,
  Sliders,
  Download,
  UserCheck,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// Helper to strip emojis and non-spoken decorative characters for clean TTS Audio Script
function sanitizeAudioScript(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#|<>{}[\]\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 5 Real-life Parenting Diagnostic Questions for Style Inference
const QUIZ_QUESTIONS = [
  {
    id: 1,
    situation: '🧸 장난감 정리 상황',
    question: '아이가 거실 바닥에 블록을 잔뜩 어질러 놓고 안 치우려고 할 때, 내가 가장 먼저 하는 말은?',
    options: [
      {
        style: 'Kind & Firm (Default)',
        label: '"블록이 바닥에 있으면 밟아서 아파. 같이 바구니에 골인시켜 볼까?"',
        tag: '이유 설명 + 긍정적 대안 제시'
      },
      {
        style: 'Short & Direct',
        label: '"정리 시간! 지금 바구니에 블록 넣자. 하나, 둘, 셋 출발!"',
        tag: '짧고 명확한 핵심 행동 지시'
      },
      {
        style: 'Warm & Gentle',
        label: '"우리 아가 더 놀고 싶었구나~ 엄마랑 손잡고 블록 친구들 코 재워줄까?"',
        tag: '감정 공감 + 다정한 애착 유도'
      }
    ]
  },
  {
    id: 2,
    situation: '🥣 식사 시간 상황',
    question: '밥 먹는 도중에 아이가 숟가락으로 장난치며 돌아다니려 할 때 나의 반응은?',
    options: [
      {
        style: 'Kind & Firm (Default)',
        label: '"밥은 의자에 앉아서 먹는 거야. 다 먹으면 내려가서 놀 수 있어."',
        tag: '명확한 규칙 + 선택권 안내'
      },
      {
        style: 'Short & Direct',
        label: '"엉덩이 의자에 착! 한 입 냠냠 꼭꼭 씹자!"',
        tag: '즉각적이고 리듬감 있는 코칭'
      },
      {
        style: 'Warm & Gentle',
        label: '"배가 조금 불렀어, 내 사랑? 엄마 옆에 포근하게 앉아서 한 번만 더 아~ 해볼까?"',
        tag: '따뜻한 어휘 + 정서적 배려'
      }
    ]
  },
  {
    id: 3,
    situation: '🛝 놀이터 안전 상황',
    question: '아이가 미끄럼틀을 거꾸로 기어 올라가서 위에서 내려오는 친구와 부딪힐 것 같을 때!',
    options: [
      {
        style: 'Kind & Firm (Default)',
        label: '"미끄럼틀은 위에서 내려오는 곳이야. 우리 계단으로 돌아가서 안전하게 타자."',
        tag: '올바른 용도 안내 + 안전한 대안'
      },
      {
        style: 'Short & Direct',
        label: '"스톱! 거꾸로 가면 위험해. 계단으로 올라가자!"',
        tag: '빠르고 단호한 안전 지시'
      },
      {
        style: 'Warm & Gentle',
        label: '"어머, 우리 소중한 다리 다칠까 봐 엄마가 걱정돼! 엄마 손 잡고 계단으로 갈까?"',
        tag: '보호 본능 표현 + 부드러운 권유'
      }
    ]
  },
  {
    id: 4,
    situation: '😭 감정 폭발 · 떼쓰기 상황',
    question: '마트나 집에서 아이가 원하는 대로 안 돼서 바닥에 주저앉아 울음을 터뜨릴 때!',
    options: [
      {
        style: 'Kind & Firm (Default)',
        label: '"속상한 마음은 알지만, 울면 엄마가 알 수 없어. 눈물 닦고 말로 이야기해 주자."',
        tag: '감정 인정 + 분명한 소통 한계 설정'
      },
      {
        style: 'Short & Direct',
        label: '"후~ 숨 크게 쉬자. 하나, 둘, 셋! 엄마 눈 보고 말로 해줘."',
        tag: '진정 카운트다운 + 행동 전환'
      },
      {
        style: 'Warm & Gentle',
        label: '"많이 속상했구나 우리 아가, 이리 와서 엄마가 꼬옥 안아줄게. 괜찮아~"',
        tag: '온전한 감정 수용 + 스킨십 안정'
      }
    ]
  },
  {
    id: 5,
    situation: '🌙 취침 · 양치 루틴 상황',
    question: '잘 시간이 지났는데도 아이가 양치하기 싫다고 도망 다닐 때 나의 스타일은?',
    options: [
      {
        style: 'Kind & Firm (Default)',
        label: '"양치를 해야 이가 건강해져. 파란 칫솔로 할지 노란 칫솔로 할지 네가 골라볼래?"',
        tag: '건강한 이유 + 자율적 선택권 부여'
      },
      {
        style: 'Short & Direct',
        label: '"양치 시간! 아~ 입 크게 벌리고 치카치카 반짝!"',
        tag: '경쾌한 의성어 + 간결한 루틴 실행'
      },
      {
        style: 'Warm & Gentle',
        label: '"우리 예쁜 이 깨끗하게 씻고, 침대에서 엄마랑 따뜻한 그림책 읽으며 코 자자~"',
        tag: '포근한 수면 연상 + 다정한 초대'
      }
    ]
  }
];

const STYLE_PROFILES = {
  'Kind & Firm (Default)': {
    title: 'Kind & Firm (다정하고 단호한 코치형)',
    badge: '✨ Kind & Firm',
    shortName: 'Kind & Firm',
    emoji: '✨',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    barColor: 'bg-amber-500',
    dot: 'bg-amber-500',
    summary: '아이의 감정은 존중하되 안 되는 한계는 분명히 짚어주고, 아이가 스스로 할 수 있는 긍정적인 대안을 제시하는 균형 잡힌 양육 스타일입니다.',
    englishCharacteristics: '"Toys are for rolling, not throwing"처럼 명확한 규칙과 "Let\'s keep them safe on the floor" 같은 긍정적 행동 가이드를 결합한 표현을 추천합니다.'
  },
  'Short & Direct': {
    title: 'Short & Direct (명쾌하고 직관적인 액션형)',
    badge: '⚡ Short & Direct',
    shortName: 'Short & Direct',
    emoji: '⚡',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barColor: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    summary: '긴 설명으로 아이의 주의가 분산되지 않도록, 2~4단어의 핵심 동작 어휘와 리듬감 있는 표현으로 즉각적인 행동 변화를 이끌어내는 스타일입니다.',
    englishCharacteristics: '"Gentle hands!", "Walking feet!", "Small bites!" 등 원어민 부모들이 가장 많이 쓰는 짧고 강렬한 행동 중심(Action-first) 문장을 추천합니다.'
  },
  'Warm & Gentle': {
    title: 'Warm & Gentle (포근한 공감과 애착 중심형)',
    badge: '🧸 Warm & Gentle',
    shortName: 'Warm & Gentle',
    emoji: '🧸',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'bg-rose-500',
    dot: 'bg-rose-500',
    summary: '훈육 상황에서도 아이의 마음을 먼저 보듬어 주고, 부모와의 따뜻한 정서적 유대감과 안정감을 통해 아이가 스스로 협력하도록 이끄는 스타일입니다.',
    englishCharacteristics: '"Sweetheart", "My love" 같은 다정한 애칭과 감정 공감 표현("I see your big feelings")이 풍부하게 담긴 포근한 문장을 추천합니다.'
  }
};

// Context-aware Smart Fallback Engine for instant, realistic coaching in Demo mode
function getSmartFallback(
  korean,
  style = 'Kind & Firm (Default)',
  age = '3-4 years (Default)',
  situation = 'Toy Play'
) {
  const cleanKorean = korean.trim();

  const isMeal = /(먹|씹|밥|식사|숟가락|젓가락|국|반찬|물|흘리|뱉|냠냠|포크|마셔|삼켜|야채|채소|골고루)/.test(cleanKorean) ||
    (situation === 'Mealtime' && !/(던지|장난감|미끄럼틀|그네|놀이터)/.test(cleanKorean));
  const isPlaygroundOrSafety = /(뛰|위험|조심|계단|미끄럼틀|넘어|손잡|서둘|차도|빨간불|차온다|다쳐|그네|놀이터|순서|차례)/.test(cleanKorean) ||
    (situation === 'Playground' && !/(던지|장난감|밥|식사|씹)/.test(cleanKorean));
  const isBedOrBath = /(자|잠|치카|양치|이닦|이 닦|목욕|씻|코자|누워|불끄|잘 시간)/.test(cleanKorean);
  const isEmotionOrTurn = /(울|속상|기다려|화나|짜증|안돼|안 돼|내거|내 거|양보|나눠)/.test(cleanKorean);

  // 1. Toy Play (Default example: "장난감 던지면 안 돼. 바닥에 내려놓고 놀자.")
  if (/(던지|장난감|내려놓|바닥)/.test(cleanKorean)) {
    if (style.startsWith('Short')) {
      const natural = "Gentle hands! Toys stay on the floor. Let's roll it right here!";
      return {
        directTranslation: "Don't throw toys. Let's put them down on the floor and play.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "⚡ [Short & Direct 맞춤 분석 · Toy Play]\n코칭 설정에서 진단된 'Short & Direct' 성향에 맞춰, 2~4단어 핵심 행동 지시어('Gentle hands', 'Toys stay on the floor')로 장난감을 던지는 행동을 즉시 멈추고 바닥 놀이로 주의를 전환합니다.",
        followUpEnglish: "One, two, three... can you roll it to mommy?"
      };
    }
    if (style.startsWith('Warm')) {
      const natural = "Oh sweetie, our toys need gentle hands so no one gets hurt. Let's put them softly on the floor and play together, my love.";
      return {
        directTranslation: "Don't throw toys. Let's put them down on the floor and play.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "🧸 [Warm & Gentle 맞춤 분석 · Toy Play]\n코칭 설정에서 진단된 'Warm & Gentle' 성향에 맞춰, 다정한 애칭(sweetie, my love)과 부드러운 공감 어조로 아이가 거부감 없이 장난감을 바닥에 내려놓도록 유도합니다.",
        followUpEnglish: "Would you like to build a big tower on the rug with mommy?"
      };
    }
    const natural = "Toys are not for throwing. Let's keep our toys safe on the floor and play gently together, sweetie.";
    return {
      directTranslation: "Don't throw toys. Let's put them down on the floor and play.",
      naturalParentEnglish: natural,
      audioScript: sanitizeAudioScript(natural),
      reasonKorean: "✨ [Kind & Firm 맞춤 분석 · Toy Play]\n진단된 'Kind & Firm' 양육 스타일에 기반하여, '던지면 안 돼'라는 명확한 한계 설정('Toys are not for throwing')과 '바닥에서 안전하게 놀자'는 긍정적 대안을 균형 있게 제시합니다.",
      followUpEnglish: "Can you show me how gently you can place the toy on the rug?"
    };
  }

  // 2. Mealtime
  if (isMeal) {
    if (style.startsWith('Short')) {
      const natural = "Small bites! Chew, chew, chew. Swallow when you are ready.";
      return {
        directTranslation: "Chew your food slowly and carefully without spilling.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "⚡ [Short & Direct 맞춤 분석 · Mealtime]\n식사 중 주의가 흐트러질 때는 긴 설명보다 3단계 핵심 동작(Small bites -> Chew -> Swallow)을 짧고 리듬감 있게 전달하는 것이 가장 효과적입니다.",
        followUpEnglish: "Ready for the next yummy bite?"
      };
    }
    if (style.startsWith('Warm')) {
      const natural = "Mmm, yummy food! Take your sweet time, my love. Let's chew slowly and softly together with mommy, okay?";
      return {
        directTranslation: "Chew your food slowly and carefully.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "🧸 [Warm & Gentle 맞춤 분석 · Mealtime]\n식사를 규율이나 의무가 아닌 즐겁고 포근한 시간으로 느끼도록 정서적 공감 어휘와 함께 아이의 속도를 존중해 줍니다.",
        followUpEnglish: "What does that yummy bite taste like in your mouth, sweetheart?"
      };
    }
    const natural = "Chew, chew, chew! Let's take small, slow bites so our tummy stays happy and strong, sweetie.";
    return {
      directTranslation: "You should chew your food slowly and thoroughly.",
      naturalParentEnglish: natural,
      audioScript: sanitizeAudioScript(natural),
      reasonKorean: "✨ [Kind & Firm 맞춤 분석 · Mealtime]\n부정형 지시 대신 'Chew, chew, chew!'라는 경쾌한 표현과 '배가 편안해진다'는 긍정적인 이유를 함께 설명하여 올바른 식습관을 길러줍니다.",
      followUpEnglish: "Can you hear that crunchy sound when you chew?"
    };
  }

  // 3. Playground / Safety
  if (isPlaygroundOrSafety) {
    if (style.startsWith('Short')) {
      const natural = "Walking feet! Use the stairs to go up. Slide down on your bottom!";
      return {
        directTranslation: "It's dangerous to climb up the slide backwards. Let's take the stairs.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "⚡ [Short & Direct 맞춤 분석 · Playground]\n놀이터 안전 상황에서는 즉각 실행 가능한 짧은 행동 언어('Walking feet', 'Use the stairs')가 아이의 귀에 가장 명확하게 전달됩니다.",
        followUpEnglish: "Ready to go down? One, two, three, wheee!"
      };
    }
    if (style.startsWith('Warm')) {
      const natural = "Oh sweetheart, mommy wants to keep your precious body safe at the playground! Let's hold hands and walk around to the stairs together.";
      return {
        directTranslation: "It's dangerous to climb up the slide backwards. Let's take the stairs.",
        naturalParentEnglish: natural,
        audioScript: sanitizeAudioScript(natural),
        reasonKorean: "🧸 [Warm & Gentle 맞춤 분석 · Playground]\n아이의 호기심을 존중하면서도 엄마가 너를 안전하게 지켜주고 싶다는 따뜻한 메시지를 전달해 자발적인 협조를 이끌어냅니다.",
        followUpEnglish: "Should we count the steps together as we climb up, my love?"
      };
    }
    const natural = "Feet go down the slide! Let's walk around and climb up the stairs so everyone stays safe, buddy.";
    return {
      directTranslation: "It's dangerous to climb up the slide backwards. Let's take the stairs.",
      naturalParentEnglish: natural,
      audioScript: sanitizeAudioScript(natural),
      reasonKorean: "✨ [Kind & Firm 맞춤 분석 · Playground]\n'위험해, 하지 마' 대신 미끄럼틀의 올바른 규칙('Feet go down the slide')과 안전한 방법('climb up the stairs')을 다정하고 분명하게 안내합니다.",
      followUpEnglish: "Can you wave to mommy from the very top of the slide?"
    };
  }

  // 4. Bedtime / Bath
  if (isBedOrBath) {
    const natural = style.startsWith('Short')
      ? "Teeth time! Open wide. Brush, brush, sparkling clean!"
      : style.startsWith('Warm')
      ? "Time to get cozy for bed, my love! Let's brush our little teeth fresh and snuggle up for sweet dreams."
      : "Bedtime routine is here! Let's brush our teeth so our smile stays bright and healthy, sweetie.";
    return {
      directTranslation: "Now let's brush our teeth and go to sleep.",
      naturalParentEnglish: natural,
      audioScript: sanitizeAudioScript(natural),
      reasonKorean: `✨ [${style} 맞춤 분석 · Routine]\n일관된 루틴 안내를 통해 아이가 수면 및 위생 습관을 예측 가능하고 편안하게 받아들이도록 돕습니다.`,
      followUpEnglish: "Which bedtime story would you like to read tonight?"
    };
  }

  // 5. Emotion / Turn-taking
  if (isEmotionOrTurn) {
    const natural = style.startsWith('Short')
      ? "Deep breath. One, two, three. Tell mommy what you need with words."
      : style.startsWith('Warm')
      ? "I see your big feelings, my sweet baby. Mommy is right here to give you a big warm hug. You are safe."
      : "It's okay to feel upset, sweetie. Let's take a deep breath together and use our gentle words.";
    return {
      directTranslation: "Wait your turn and tell me calmly without crying.",
      naturalParentEnglish: natural,
      audioScript: sanitizeAudioScript(natural),
      reasonKorean: `✨ [${style} 맞춤 분석 · Emotional Coaching]\n아이의 감정은 충분히 수용하되, 울음이나 떼쓰기 대신 말로 표현하는 건강한 소통 방법을 코칭합니다.`,
      followUpEnglish: "Can you tell mommy what happened using your gentle voice?"
    };
  }

  // 6. General fallback
  const natural = style.startsWith('Short')
    ? "Eyes on mommy! Let's do this gently step by step. You can do it!"
    : style.startsWith('Warm')
    ? "I hear you, sweetheart, and mommy loves you so much! Let's do this together nice and gently, okay?"
    : "Let's make a great choice together, sweetie! We can do this in a safe and happy way.";
  return {
    directTranslation: `Literal translation of: "${cleanKorean}"`,
    naturalParentEnglish: natural,
    audioScript: sanitizeAudioScript(natural),
    reasonKorean: `✨ [${style} 맞춤 분석 · ${situation}]\n아이의 발달 연령(${age})과 상황(${situation})에 맞추어 긍정적인 행동 방향을 다정하고 명확하게 제시합니다.`,
    followUpEnglish: "How does that sound to you, sweetie?"
  };
}

const SITUATION_PRESETS = {
  'Playground': {
    label: 'Playground',
    icon: '🛝',
    koreanLabel: '놀이터',
    example: '미끄럼틀 거꾸로 올라가면 위험해. 계단으로 올라가자.'
  },
  'Mealtime': {
    label: 'Mealtime',
    icon: '🥣',
    koreanLabel: '식사 시간',
    example: '천천히 꼭꼭 씹어 먹어야지. 흘리지 말고 숟가락으로 먹자.'
  },
  'Toy Play': {
    label: 'Toy Play',
    icon: '🧸',
    koreanLabel: '장난감 놀이',
    example: '장난감 던지면 안 돼. 바닥에 내려놓고 놀자.'
  }
};

export default function App() {
  // Navigation Tab State ('coach' | 'mypage' | 'saved' | 'settings')
  const [activeTab, setActiveTab] = useState('coach');

  // 1. Onboarding / Profile Section State (Persisted in localStorage)
  const [parentingStyle, setParentingStyle] = useState(() => {
    return localStorage.getItem('LITTLE_BRIDGE_STYLE') || 'Kind & Firm (Default)';
  });
  const [childAge, setChildAge] = useState(() => {
    return localStorage.getItem('LITTLE_BRIDGE_AGE') || '3-4 years (Default)';
  });
  const [childName, setChildName] = useState(() => {
    return localStorage.getItem('LITTLE_BRIDGE_CHILD_NAME') || '우리 아이';
  });

  // Parenting Style Diagnostic Quiz State (My Page)
  const [quizAnswers, setQuizAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('LITTLE_BRIDGE_QUIZ_ANSWERS');
      return saved ? JSON.parse(saved) : {
        1: 'Kind & Firm (Default)',
        2: 'Kind & Firm (Default)',
        3: 'Short & Direct',
        4: 'Warm & Gentle',
        5: 'Kind & Firm (Default)'
      };
    } catch {
      return {
        1: 'Kind & Firm (Default)',
        2: 'Kind & Firm (Default)',
        3: 'Short & Direct',
        4: 'Warm & Gentle',
        5: 'Kind & Firm (Default)'
      };
    }
  });
  const [hasCompletedDiagnosis, setHasCompletedDiagnosis] = useState(() => {
    return localStorage.getItem('LITTLE_BRIDGE_DIAGNOSED') === 'true';
  });
  const [currentQuestionStep, setCurrentQuestionStep] = useState(0); // 0..4 or 5 (result view)

  // Compute statistical breakdown from quizAnswers
  const styleStats = React.useMemo(() => {
    const counts = {
      'Kind & Firm (Default)': 0,
      'Short & Direct': 0,
      'Warm & Gentle': 0
    };
    const values = Object.values(quizAnswers);
    values.forEach((ans) => {
      if (counts[ans] !== undefined) counts[ans] += 1;
    });
    const total = values.length || 1;
    const percentages = {
      'Kind & Firm (Default)': Math.round((counts['Kind & Firm (Default)'] / total) * 100),
      'Short & Direct': Math.round((counts['Short & Direct'] / total) * 100),
      'Warm & Gentle': Math.round((counts['Warm & Gentle'] / total) * 100)
    };
    // Find dominant style
    let inferredStyle = 'Kind & Firm (Default)';
    let maxCount = -1;
    Object.entries(counts).forEach(([st, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        inferredStyle = st;
      }
    });
    return { counts, percentages, inferredStyle, totalAnswered: values.length };
  }, [quizAnswers]);

  // 2. Main Input Section State
  const [koreanText, setKoreanText] = useState('장난감 던지면 안 돼. 바닥에 내려놓고 놀자.');
  const [situation, setSituation] = useState('Toy Play');

  // 3. Output Card Section State
  const [result, setResult] = useState(() =>
    getSmartFallback(
      '장난감 던지면 안 돼. 바닥에 내려놓고 놀자.',
      localStorage.getItem('LITTLE_BRIDGE_STYLE') || 'Kind & Firm (Default)',
      localStorage.getItem('LITTLE_BRIDGE_AGE') || '3-4 years (Default)',
      'Toy Play'
    )
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 4. Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechType, setActiveSpeechType] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [copiedKey, setCopiedKey] = useState('');

  // 5. API Key State
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // 6. PWA Install Guide Modal & Prompt
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 7. History / Saved State
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('LITTLE_BRIDGE_HISTORY');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isInitialMount = useRef(true);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const didTriggerFromVoiceRef = useRef(false);
  const koreanInputRef = useRef(null);
  const outputCardRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceModeLabel, setVoiceModeLabel] = useState('');
  const [iosVoiceGuide, setIosVoiceGuide] = useState('');

  // Available browser speech voices
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const addToHistory = (item) => {
    setHistory((prev) => {
      const updated = [
        item,
        ...prev.filter((h) => h.korean !== item.korean || h.parentingStyle !== item.parentingStyle)
      ].slice(0, 15);
      try {
        localStorage.setItem('LITTLE_BRIDGE_HISTORY', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Update & Persist Style and Age
  const updateParentingStyle = (newStyle) => {
    setParentingStyle(newStyle);
    try { localStorage.setItem('LITTLE_BRIDGE_STYLE', newStyle); } catch {}
  };

  const updateChildAge = (newAge) => {
    setChildAge(newAge);
    try { localStorage.setItem('LITTLE_BRIDGE_AGE', newAge); } catch {}
  };

  // Handle Quiz Option Selection & Automatic Style Inference
  const handleSelectQuizOption = (questionId, selectedStyle) => {
    const updatedAnswers = { ...quizAnswers, [questionId]: selectedStyle };
    setQuizAnswers(updatedAnswers);
    try {
      localStorage.setItem('LITTLE_BRIDGE_QUIZ_ANSWERS', JSON.stringify(updatedAnswers));
    } catch {}

    // Calculate new inferred dominant style immediately
    const counts = {
      'Kind & Firm (Default)': 0,
      'Short & Direct': 0,
      'Warm & Gentle': 0
    };
    Object.values(updatedAnswers).forEach((st) => {
      if (counts[st] !== undefined) counts[st] += 1;
    });
    let bestStyle = parentingStyle;
    let maxVal = -1;
    Object.entries(counts).forEach(([st, cnt]) => {
      if (cnt > maxVal) {
        maxVal = cnt;
        bestStyle = st;
      }
    });

    // Advance step or complete diagnosis
    if (currentQuestionStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionStep((prev) => prev + 1);
    } else {
      setHasCompletedDiagnosis(true);
      updateParentingStyle(bestStyle);
      try { localStorage.setItem('LITTLE_BRIDGE_DIAGNOSED', 'true'); } catch {}
    }
  };

  // Apply inferred style and go to Coach Home
  const applyInferredStyleAndGoHome = () => {
    updateParentingStyle(styleStats.inferredStyle);
    setHasCompletedDiagnosis(true);
    try { localStorage.setItem('LITTLE_BRIDGE_DIAGNOSED', 'true'); } catch {}
    setActiveTab('coach');
    generateVoice(koreanText, styleStats.inferredStyle, childAge, situation, apiKey, false);
  };

  // 5. Gemini 4 Argon API Integration using @google/genai SDK
  const generateVoice = useCallback(async (text, style, age, currentSituation, currentApiKey, shouldScroll = false) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    const effectiveApiKey = currentApiKey !== undefined ? currentApiKey : (apiKey || import.meta.env.VITE_GEMINI_API_KEY);

    if (!effectiveApiKey) {
      setTimeout(() => {
        const generated = getSmartFallback(text, style, age, currentSituation);
        setResult(generated);
        addToHistory({
          korean: text.trim(),
          parentingStyle: style,
          childAge: age,
          situation: currentSituation,
          ...generated,
          timestamp: Date.now()
        });
        setIsLoading(false);
        if (shouldScroll && outputCardRef.current) {
          outputCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 240);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      const prompt = `You are "Little Bridge", an expert AI Bilingual Parenting Coach and native American English pediatric communication specialist.
Transform the Korean parent's input into authentic, child-developmentally sound spoken English tailored to the parent's diagnosed Parenting Style, Child Age, and Situation.

[Input Context]
- Parent's Korean Input: "${text}"
- Situation: "${currentSituation}"
- Diagnosed Parenting Style: "${style}" (Statistical distribution: Kind & Firm ${styleStats.percentages['Kind & Firm (Default)']}%, Short & Direct ${styleStats.percentages['Short & Direct']}%, Warm & Gentle ${styleStats.percentages['Warm & Gentle']}%)
- Child Age: "${age}"

[Style Guidelines]
- "Kind & Firm (Default)": Warm, respectful boundaries with positive redirection (focus on what the child CAN do).
- "Short & Direct": Crisp, clear, 2-3 short sentences (3-5 words per clause), action-oriented for immediate comprehension.
- "Warm & Gentle": High empathy, affectionate tone, gentle invitation with loving terms (sweetie, my love, honey).

[Output JSON Schema Requirements]
Return a valid JSON object with EXACTLY these 5 keys:
{
  "directTranslation": "Literal English translation of the Korean input",
  "naturalParentEnglish": "Styled, natural American parent English expression matching the style and age",
  "audioScript": "Clean spoken text of naturalParentEnglish without any emojis, markdown, quotation marks, or special characters (optimized for browser SpeechSynthesis)",
  "reasonKorean": "Detailed Korean explanation of why this phrasing works well for the child's development and the parent's diagnosed parenting style",
  "followUpEnglish": "A natural follow-up question in English to continue positive interaction with the child"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          response_mime_type: 'application/json',
          thinkingConfig: {
            thinkingLevel: 'MEDIUM',
          },
          thinking_level: 'medium',
          temperature: 0.7,
        },
      });

      const rawText = response?.text;
      if (!rawText) {
        throw new Error('Empty response received from Gemini 4 Argon API.');
      }

      const parsed = JSON.parse(rawText);
      const normalized = {
        directTranslation: parsed.directTranslation || parsed.direct_translation || '',
        naturalParentEnglish: parsed.naturalParentEnglish || parsed.natural_parent_english || '',
        audioScript: sanitizeAudioScript(parsed.audioScript || parsed.audio_script || parsed.naturalParentEnglish || ''),
        reasonKorean: parsed.reasonKorean || parsed.reason_korean || '',
        followUpEnglish: parsed.followUpEnglish || parsed.follow_up_english || ''
      };

      setResult(normalized);
      addToHistory({
        korean: text.trim(),
        parentingStyle: style,
        childAge: age,
        situation: currentSituation,
        ...normalized,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Gemini 4 Argon API Error:', err);
      const fallback = getSmartFallback(text, style, age, currentSituation);
      setResult(fallback);
      setErrorMessage(`스마트 코칭 엔진으로 자동 응답되었습니다 (${err.message || 'API 확인'}).`);
    } finally {
      setIsLoading(false);
      if (shouldScroll && outputCardRef.current) {
        outputCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [apiKey, styleStats.percentages]);

  // Auto-update when Parenting Style or Child Age changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    generateVoice(koreanText, parentingStyle, childAge, situation, apiKey, false);
  }, [parentingStyle, childAge]);

  const handleSelectSituation = (sitKey) => {
    setSituation(sitKey);
    const presetExample = SITUATION_PRESETS[sitKey]?.example || koreanText;
    setKoreanText(presetExample);
    generateVoice(presetExample, parentingStyle, childAge, sitKey, apiKey, false);
  };

  // Helper: Convert recorded audio Blob to Base64 for Gemini Multimodal STT
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result || '').toString().split(',')[1] || '';
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // Fallback for iOS Home Screen Standalone PWA where Apple blocks webkitSpeechRecognition
  const startMediaRecorderFallback = async () => {
    const effectiveApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    // If no API key or no mediaDevices, focus textarea immediately for iOS Native Keyboard Dictation (🎙️)
    if (!effectiveApiKey || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (koreanInputRef.current) {
        koreanInputRef.current.focus();
      }
      setIosVoiceGuide(
        '💡 아이폰 [홈 화면 앱]에서는 iOS 보안 정책상 웹 음성인식이 제한됩니다. 지금 올라온 아이폰 키보드 우측 하단의 마이크(🎙️) 버튼을 누르시면 가장 빠르고 정확하게 음성 입력이 됩니다! (또는 상단 🔑 버튼에 Gemini API 키를 넣으면 자체 AI 음성 녹음이 작동합니다.)'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        setVoiceModeLabel('');

        if (chunks.length === 0) return;
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/mp4' });
        setIsLoading(true);
        setIosVoiceGuide('');
        try {
          const base64Audio = await blobToBase64(audioBlob);
          const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
          const sttResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                inlineData: {
                  mimeType: audioBlob.type || 'audio/mp4',
                  data: base64Audio
                }
              },
              '이 한국어 음성을 들리는 그대로 한국어 텍스트로만 정확히 받아적어줘. 다른 설명이나 따옴표 없이 한국어 문장만 출력해.'
            ]
          });
          const transcribed = (sttResponse?.text || '').trim();
          if (transcribed) {
            setKoreanText(transcribed);
            generateVoice(transcribed, parentingStyle, childAge, situation, effectiveApiKey, true);
          } else {
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Gemini Audio STT error:', err);
          setIsLoading(false);
          if (koreanInputRef.current) koreanInputRef.current.focus();
          setIosVoiceGuide('키보드 우측 하단의 마이크(🎙️) 버튼을 눌러 말씀해 주세요.');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      setVoiceModeLabel('녹음 완료 (터치)');
      setIosVoiceGuide('🎙️ 말씀하신 후 [녹음 완료] 버튼을 한 번 더 눌러주세요.');
    } catch {
      setIsListening(false);
      setVoiceModeLabel('');
      if (koreanInputRef.current) {
        koreanInputRef.current.focus();
      }
      setIosVoiceGuide(
        '💡 아이폰 키보드 우측 하단의 마이크(🎙️) 버튼을 누르시면 바로 음성으로 말할 수 있습니다!'
      );
    }
  };

  // Speech Recognition (STT) for Korean voice input (with iOS Safari & Standalone PWA support)
  const toggleListening = () => {
    setIosVoiceGuide('');

    // If currently listening/recording, stop and process immediately
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
        return;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setVoiceModeLabel('');
      return;
    }

    const isIOSStandalone =
      typeof window !== 'undefined' &&
      (window.navigator.standalone === true ||
        (window.matchMedia('(display-mode: standalone)').matches &&
          /iPhone|iPad|iPod/i.test(navigator.userAgent)));

    const SpeechRecognition =
      typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

    // On iOS Home Screen Standalone mode, Apple disables webkitSpeechRecognition (throws service-not-allowed).
    // Immediately use MediaRecorder + Gemini Audio or iOS Native Dictation helper!
    if (!SpeechRecognition || isIOSStandalone) {
      startMediaRecorderFallback();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      latestTranscriptRef.current = '';
      didTriggerFromVoiceRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceModeLabel('듣는 중... (완료 시 터치)');
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript) {
          latestTranscriptRef.current = fullTranscript;
          setKoreanText(fullTranscript);
          if (event.results[event.results.length - 1].isFinal) {
            didTriggerFromVoiceRef.current = true;
            generateVoice(fullTranscript, parentingStyle, childAge, situation, apiKey, true);
          }
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setVoiceModeLabel('');
        // If iOS blocks webkitSpeechRecognition with service-not-allowed / not-allowed, fall back automatically
        if (
          event?.error === 'service-not-allowed' ||
          event?.error === 'not-allowed' ||
          event?.error === 'audio-capture'
        ) {
          startMediaRecorderFallback();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceModeLabel('');
        // iOS Safari often fires onend without setting isFinal=true; trigger generation if transcript exists
        if (latestTranscriptRef.current && !didTriggerFromVoiceRef.current) {
          didTriggerFromVoiceRef.current = true;
          generateVoice(latestTranscriptRef.current, parentingStyle, childAge, situation, apiKey, true);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceModeLabel('');
      startMediaRecorderFallback();
    }
  };

  // Save API Key
  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('GEMINI_API_KEY', trimmed);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
    setShowKeyModal(false);
    generateVoice(koreanText, parentingStyle, childAge, situation, trimmed, false);
  };

  // Browser SpeechSynthesis API (window.speechSynthesis)
  const handleSpeak = (textToSpeak, type = 'natural') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 합성(window.speechSynthesis)을 지원하지 않습니다.');
      return;
    }

    if (isSpeaking && activeSpeechType === type) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechType(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanScript = sanitizeAudioScript(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(cleanScript);
    utterance.rate = speechRate;
    utterance.pitch = parentingStyle.startsWith('Warm') ? 1.12 : 1.04;
    utterance.lang = 'en-US';

    const preferredVoice = voices.find(
      (v) =>
        (v.lang === 'en-US' || v.lang === 'en_US') &&
        (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Ava'))
    ) || voices.find((v) => v.lang && v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeechType(type);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechType(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechType(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generateVoice(koreanText, parentingStyle, childAge, situation, apiKey, true);
    }
  };

  const currentTheme = STYLE_PROFILES[parentingStyle] || STYLE_PROFILES['Kind & Firm (Default)'];
  const inferredProfile = STYLE_PROFILES[styleStats.inferredStyle] || STYLE_PROFILES['Kind & Firm (Default)'];
  const cleanAudioScript = result?.audioScript || sanitizeAudioScript(result?.naturalParentEnglish || '');

  return (
    <div className="min-h-screen bg-[#E6E0D6] flex flex-col items-center justify-start sm:py-6 select-none sm:select-auto">
      {/* Mobile App Frame Container (Full screen on mobile, Phone frame on desktop) */}
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[860px] bg-[#FAF7F2] sm:rounded-[42px] sm:shadow-2xl sm:border-[7px] sm:border-slate-900/95 flex flex-col justify-between overflow-hidden relative">
        
        {/* 1. Top Mobile App Header (Sticky) */}
        <header className="bg-white/95 backdrop-blur-md border-b border-amber-100/90 sticky top-0 z-30 px-4 pt-3.5 pb-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img
                src="/app-icon.png"
                onError={(e) => {
                  e.currentTarget.src = '/icon.svg';
                }}
                alt="Little Bridge 앱 아이콘"
                className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-amber-200/90 shrink-0 bg-[#FFFDF7]"
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                    Little Bridge
                  </h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-bridge-100 text-bridge-800">
                    AI APP
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Say it naturally. Grow with two languages.
                </p>
              </div>
            </div>

            {/* Right App Actions: Install App + API Key Status */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="홈 화면에 앱 설치"
              >
                <Download className="w-3 h-3" />
                <span>앱 설치</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempApiKey(apiKey);
                  setShowKeyModal(true);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  apiKey
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
                title="Gemini 4 Argon API 설정"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
          
          {/* ========================================================= */}
          {/* TAB 1: COACH HOME (Main Single-Page Coaching Experience)  */}
          {/* ========================================================= */}
          {activeTab === 'coach' && (
            <>
              {/* Diagnostic Style Banner (Links to Coaching Settings Quiz) */}
              <div
                onClick={() => setActiveTab('mypage')}
                className="bg-gradient-to-r from-bridge-600 via-bridge-500 to-amber-500 rounded-3xl p-3.5 text-white shadow-sm cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold backdrop-blur-xs">
                      {hasCompletedDiagnosis ? '✓ AI 양육 성향 진단 완료' : '💡 30초 양육 성향 테스트'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-100">
                      {styleStats.percentages[parentingStyle] || 60}% 일치
                    </span>
                  </div>
                  <p className="text-xs font-extrabold leading-snug pt-0.5">
                    현재 {childName} 맞춤 스타일: <span className="underline decoration-amber-200 decoration-2 underline-offset-2">{currentTheme.shortName}</span>
                  </p>
                  <p className="text-[10px] text-amber-50/90">
                    터치하여 코칭 설정에서 5문항 케이스별 양육 성향 진단·통계 보기
                  </p>
                </div>
                <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* 2. Onboarding / Profile Section */}
              <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-bridge-700 flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Onboarding · Profile</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mypage')}
                    className="text-[11px] font-bold text-bridge-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>코칭 설정 · 내 성향 진단</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Parenting Style Select */}
                  <div className="space-y-1">
                    <label
                      htmlFor="parenting-style-select"
                      className="text-[11px] font-bold text-slate-500 flex items-center space-x-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-bridge-600" />
                      <span>Parenting Style</span>
                    </label>
                    <div className="relative">
                      <select
                        id="parenting-style-select"
                        value={parentingStyle}
                        onChange={(e) => updateParentingStyle(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-bridge-400 appearance-none pr-6 cursor-pointer"
                      >
                        <option value="Kind & Firm (Default)">Kind & Firm (Default)</option>
                        <option value="Short & Direct">Short & Direct</option>
                        <option value="Warm & Gentle">Warm & Gentle</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Child Age Select */}
                  <div className="space-y-1">
                    <label
                      htmlFor="child-age-select"
                      className="text-[11px] font-bold text-slate-500 flex items-center space-x-1"
                    >
                      <Baby className="w-3 h-3 text-bridge-600" />
                      <span>Child Age</span>
                    </label>
                    <div className="relative">
                      <select
                        id="child-age-select"
                        value={childAge}
                        onChange={(e) => updateChildAge(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-bridge-400 appearance-none pr-6 cursor-pointer"
                      >
                        <option value="1-2 years">1-2 years</option>
                        <option value="3-4 years (Default)">3-4 years (Default)</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Main Input Section */}
              <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                {/* Situation Selector: "Playground", "Mealtime", "Toy Play" */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <Compass className="w-3.5 h-3.5 text-bridge-600" />
                    <span>Situation Selector (상황 선택)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Playground', 'Mealtime', 'Toy Play'].map((sitKey) => {
                      const item = SITUATION_PRESETS[sitKey];
                      const isSelected = situation === sitKey;
                      return (
                        <button
                          key={sitKey}
                          type="button"
                          onClick={() => handleSelectSituation(sitKey)}
                          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-center transition-all active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-bridge-50 border-bridge-500 text-bridge-900 shadow-2xs ring-2 ring-bridge-200/70 font-bold'
                              : 'bg-[#FAF7F2] border-slate-200/80 text-slate-600 hover:bg-slate-50 font-semibold'
                          }`}
                        >
                          <span className="text-xl mb-0.5">{item.icon}</span>
                          <span className="text-xs tracking-tight">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{item.koreanLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parent's Korean Input Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="korean-input-textarea"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-bridge-600" />
                      <span>Parent's Korean Input</span>
                    </label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                          : 'bg-bridge-50 text-bridge-800 border border-bridge-200'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isListening ? (voiceModeLabel || '듣는 중...') : '음성으로 말하기'}</span>
                    </button>
                  </div>

                  {iosVoiceGuide && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 text-[11px] leading-relaxed flex items-start justify-between gap-2">
                      <span>{iosVoiceGuide}</span>
                      <button
                        type="button"
                        onClick={() => setIosVoiceGuide('')}
                        className="text-indigo-400 hover:text-indigo-700 font-bold shrink-0 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      id="korean-input-textarea"
                      ref={koreanInputRef}
                      value={koreanText}
                      onChange={(e) => setKoreanText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={3}
                      placeholder="장난감 던지면 안 돼. 바닥에 내려놓고 놀자."
                      className="w-full bg-[#FAF7F2] border border-slate-200 focus:ring-2 focus:ring-bridge-400 focus:border-bridge-400 rounded-2xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden resize-none font-semibold leading-relaxed"
                    />
                    {koreanText && (
                      <button
                        type="button"
                        onClick={() => setKoreanText('')}
                        className="absolute bottom-2.5 right-3 text-[11px] text-slate-400 hover:text-slate-600 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/70"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate Parent Voice Button */}
                <button
                  type="button"
                  onClick={() => generateVoice(koreanText, parentingStyle, childAge, situation, apiKey, true)}
                  disabled={isLoading || !koreanText.trim()}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-bridge-600 to-amber-500 hover:from-bridge-700 hover:to-amber-600 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-bridge-200/90 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Parent Voice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Parent Voice</span>
                    </>
                  )}
                </button>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </section>

              {/* 4. Output Card Section */}
              <section
                ref={outputCardRef}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-4 sm:p-5 relative overflow-hidden space-y-3.5"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-bridge-500 via-amber-400 to-sage-400" />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base">🌿</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-bridge-800">
                      Parent Voice Card
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${currentTheme.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot}`}></span>
                      <span>{currentTheme.badge}</span>
                    </span>
                  </div>
                </div>

                {/* 4.2 Natural Parent English (Styled) + Listen CTA */}
                <div className="space-y-3 bg-gradient-to-br from-bridge-50/80 via-amber-50/40 to-white p-4 rounded-2xl border border-bridge-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-bridge-800 flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-bridge-500 text-white text-[10px]">★</span>
                      Natural Parent English
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result?.naturalParentEnglish, 'natural')}
                      className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 hover:text-bridge-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'natural' ? (
                        <span className="text-emerald-600">✓ 복사됨</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-lg font-extrabold text-slate-900 leading-snug tracking-tight">
                    "{result?.naturalParentEnglish || ''}"
                  </p>

                  {/* 🔊 Listen in Parent Voice Button */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpeak(cleanAudioScript, 'natural')}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                        isSpeaking && activeSpeechType === 'natural'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-bridge-600 hover:bg-bridge-700 text-white'
                      }`}
                    >
                      {isSpeaking && activeSpeechType === 'natural' ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>🔊 Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>🔊 Listen in Parent Voice</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-1 bg-white px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSpeechRate(0.85)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          speechRate < 0.95 ? 'bg-bridge-100 text-bridge-800' : 'text-slate-400'
                        }`}
                      >
                        0.85x
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechRate(1.0)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          speechRate >= 0.95 ? 'bg-bridge-100 text-bridge-800' : 'text-slate-400'
                        }`}
                      >
                        1.0x
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4.1 Direct Translation (Literal) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Direct Translation (Literal)
                    </span>
                    <span className="text-[10px] text-slate-400">단순 직역 비교</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium italic">
                    "{result?.directTranslation || '-'}"
                  </p>
                </div>

                {/* 4.3 Audio Script (Clean text without special characters) */}
                <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                      <Headphones className="w-3 h-3 text-indigo-600" />
                      Audio Script (Clean Text)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanAudioScript, 'audio')}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'audio' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 font-mono leading-relaxed select-all">
                    {cleanAudioScript || '-'}
                  </p>
                </div>

                {/* 4.4 Reason for recommendation (Korean explanation) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                      Reason for Recommendation (추천 이유)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {result?.reasonKorean || '-'}
                  </p>
                </div>

                {/* 4.5 Follow-up Question */}
                <div className="p-3.5 rounded-2xl bg-sage-50/80 border border-sage-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-sage-700" />
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-sage-800">
                        Follow-up Question (대화 이어가기)
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleSpeak(result?.followUpEnglish, 'followup')}
                        className="p-1 rounded-lg text-sage-700 hover:bg-sage-200/60 cursor-pointer"
                        title="Listen Follow-up"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(result?.followUpEnglish, 'followup')}
                        className="p-1 rounded-lg text-sage-700 hover:bg-sage-200/60 cursor-pointer"
                        title="Copy Follow-up"
                      >
                        {copiedKey === 'followup' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 italic">
                    "{result?.followUpEnglish || '-'}"
                  </p>
                </div>
              </section>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: COACHING SETTINGS (Parenting Style Quiz & Stats)   */}
          {/* ========================================================= */}
          {activeTab === 'mypage' && (
            <div className="space-y-4">
              {/* Top Profile & Inferred Style Statistical Report Card */}
              <section className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-bridge-500 to-indigo-500" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-2xl bg-bridge-100 text-bridge-700 flex items-center justify-center font-black">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-bridge-600">
                        AI Parenting Persona Report
                      </span>
                      <h2 className="text-sm font-black text-slate-900">
                        코칭 설정 · 양육 스타일 통계 분석
                      </h2>
                    </div>
                  </div>
                  <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${inferredProfile.color}`}>
                    {inferredProfile.badge}
                  </span>
                </div>

                {/* Child Nickname & Age Quick Edit */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#FAF7F2] border border-slate-200/70">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">아이 애칭</label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => {
                        setChildName(e.target.value);
                        try { localStorage.setItem('LITTLE_BRIDGE_CHILD_NAME', e.target.value); } catch {}
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                      placeholder="예: 지우, 우리 아가"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">아이 연령대</label>
                    <select
                      value={childAge}
                      onChange={(e) => updateChildAge(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="1-2 years">1-2 years</option>
                      <option value="3-4 years (Default)">3-4 years (Default)</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                </div>

                {/* Statistical Breakdown Bars */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-bridge-600" />
                      <span>내 양육 스타일 분포 통계 (5개 실전 케이스 기반)</span>
                    </span>
                  </div>

                  {['Kind & Firm (Default)', 'Short & Direct', 'Warm & Gentle'].map((stKey) => {
                    const prof = STYLE_PROFILES[stKey];
                    const pct = styleStats.percentages[stKey] || 0;
                    const cnt = styleStats.counts[stKey] || 0;
                    const isDominant = styleStats.inferredStyle === stKey;
                    return (
                      <div key={stKey} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold flex items-center gap-1 ${isDominant ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>
                            <span>{prof.emoji}</span>
                            <span>{prof.shortName}</span>
                            {isDominant && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-bridge-100 text-bridge-800 font-extrabold">
                                주력 성향
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-extrabold text-slate-700">
                            {pct}% <span className="text-[10px] font-normal text-slate-400">({cnt}/5문항)</span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${prof.barColor}`}
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inferred Persona Explanation Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-bridge-50/90 to-amber-50/50 border border-bridge-200/80 space-y-1.5">
                  <p className="text-xs font-extrabold text-bridge-900">
                    🎯 추론된 양육 페르소나: {inferredProfile.title}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {inferredProfile.summary}
                  </p>
                  <p className="text-[11px] text-bridge-800 font-medium pt-1 border-t border-bridge-200/60">
                    💬 <strong>AI 영어 코칭 반영 방식:</strong> {inferredProfile.englishCharacteristics}
                  </p>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={applyInferredStyleAndGoHome}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>추론된 '{inferredProfile.shortName}' 스타일로 코칭 시작하기</span>
                </button>
              </section>

              {/* Interactive 5-Case Parenting Style Diagnostic Quiz */}
              <section className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                      Interactive Case Diagnosis
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      실전 육아 케이스별 나의 반응 선택 (5문항)
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold text-bridge-700 bg-bridge-50 px-2.5 py-1 rounded-xl border border-bridge-200">
                    {currentQuestionStep + 1} / {QUIZ_QUESTIONS.length}
                  </span>
                </div>

                {/* Step Selector Pills */}
                <div className="grid grid-cols-5 gap-1.5">
                  {QUIZ_QUESTIONS.map((q, idx) => {
                    const answeredStyle = quizAnswers[q.id];
                    const isCurrent = currentQuestionStep === idx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionStep(idx)}
                        className={`py-1.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-bridge-600 text-white border-bridge-600 shadow-2xs'
                            : answeredStyle
                            ? 'bg-bridge-50 text-bridge-800 border-bridge-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        Q{q.id}
                      </button>
                    );
                  })}
                </div>

                {/* Active Question Card */}
                {(() => {
                  const activeQ = QUIZ_QUESTIONS[currentQuestionStep] || QUIZ_QUESTIONS[0];
                  const selectedForQ = quizAnswers[activeQ.id];
                  return (
                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-slate-200/80 space-y-1">
                        <span className="text-[11px] font-extrabold text-bridge-700">
                          Case {activeQ.id}. {activeQ.situation}
                        </span>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                          {activeQ.question}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {activeQ.options.map((opt) => {
                          const isChosen = selectedForQ === opt.style;
                          return (
                            <button
                              key={opt.style}
                              type="button"
                              onClick={() => handleSelectQuizOption(activeQ.id, opt.style)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer space-y-1 ${
                                isChosen
                                  ? 'bg-bridge-50/90 border-bridge-500 ring-2 ring-bridge-200/70 shadow-2xs'
                                  : 'bg-white border-slate-200 hover:border-bridge-300 hover:bg-slate-50/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {opt.tag}
                                </span>
                                {isChosen && (
                                  <span className="text-[11px] font-extrabold text-bridge-700 flex items-center gap-0.5">
                                    <Check className="w-3.5 h-3.5" /> 선택됨
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed pt-0.5">
                                {opt.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </section>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COACHING HISTORY                                   */}
          {/* ========================================================= */}
          {activeTab === 'saved' && (
            <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-bridge-600" />
                  <h2 className="text-sm font-extrabold text-slate-900">코칭 기록 ({history.length})</h2>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('LITTLE_BRIDGE_HISTORY');
                    }}
                    className="text-xs text-rose-500 font-bold cursor-pointer"
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <p className="text-2xl">📭</p>
                  <p>아직 저장된 코칭 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setKoreanText(item.korean);
                        updateParentingStyle(item.parentingStyle || 'Kind & Firm (Default)');
                        updateChildAge(item.childAge || '3-4 years (Default)');
                        if (item.situation) setSituation(item.situation);
                        setResult(item);
                        setActiveTab('coach');
                      }}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-bridge-300 bg-[#FAF7F2]/60 cursor-pointer space-y-1.5 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bridge-100 text-bridge-800">
                          {item.situation || 'Toy Play'} · {item.parentingStyle?.split(' ')[0]}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">"{item.naturalParentEnglish}"</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.korean}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ========================================================= */}
          {/* TAB 4: APP & API SETTINGS                                 */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <section className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-bridge-100 text-bridge-700 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Gemini 4 Argon API 연동</h3>
                    <p className="text-[11px] text-slate-500">@google/genai SDK · thinking_level: medium</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Google AI Studio API Key</label>
                  <input
                    type="password"
                    value={tempApiKey || apiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-[#FAF7F2]"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-bridge-600 hover:bg-bridge-700 cursor-pointer"
                    >
                      API Key 저장
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempApiKey('');
                        setApiKey('');
                        localStorage.removeItem('GEMINI_API_KEY');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-bridge-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">스마트폰 홈 화면에 앱으로 추가하기</h3>
                </div>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-800">🍎 iPhone (Safari)</p>
                  <p>하단 가운데 <strong>공유 버튼(⬆️)</strong> 터치 → <strong>'홈 화면에 추가'</strong>를 누르면 일반 네이티브 앱처럼 전체화면 아이콘으로 설치됩니다.</p>
                  <p className="font-semibold text-slate-800 pt-1">🤖 Android (Chrome)</p>
                  <p>우측 상단 <strong>메뉴(⋮)</strong> 터치 → <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 누르세요.</p>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Bottom Mobile App Navigation Bar (4 Tabs) */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-around z-30">
          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'coach' ? 'text-bridge-600 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">코칭 홈</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mypage')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'mypage' ? 'text-bridge-600 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">코칭 설정</span>
            <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'saved' ? 'text-bridge-600 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Bookmark className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">코칭 기록</span>
            {history.length > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-bridge-500 text-white text-[9px] flex items-center justify-center font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setTempApiKey(apiKey);
              setActiveTab('settings');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-bridge-600 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Sliders className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">앱 설정</span>
          </button>
        </nav>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-bridge-100 text-bridge-700 flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Gemini 4 Argon API 설정</h3>
                    <p className="text-[11px] text-slate-500">@google/genai SDK 연동</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p>Google AI Studio에서 발급받은 API 키를 입력하면 실시간 Gemini 4 Argon 코칭이 활성화됩니다.</p>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bridge-600 hover:bg-bridge-700 cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile PWA Install Guide Modal */}
        {showInstallModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📲</span>
                  <h3 className="text-sm font-extrabold text-slate-900">내 휴대폰에 앱으로 설치하기</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">🍎 아이폰 (Safari 브라우저)</p>
                  <p>1. 화면 하단 가운데 <strong>공유 아이콘 [⬆️]</strong>을 누르세요.</p>
                  <p>2. 메뉴를 내려 <strong>[홈 화면에 추가]</strong>를 누르면 바탕화면에 <strong>Little Bridge 앱 아이콘</strong>이 생성됩니다!</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">🤖 안드로이드 (Chrome 브라우저)</p>
                  <p>1. 화면 우측 상단 <strong>점 3개 메뉴 [⋮]</strong>를 누르세요.</p>
                  <p>2. <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 누르면 즉시 앱으로 설치됩니다!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 cursor-pointer"
              >
                확인했어요
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
