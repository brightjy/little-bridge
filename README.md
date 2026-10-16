# Little Bridge (AI Bilingual Parenting Coach) 🌉

> **"Say it naturally. Grow with two languages."**
> AI 이중언어 양육 코치 — 부모의 한국어 표현을 아이의 연령과 양육 스타일에 맞는 다정한 원어민 부모 영어로 변환합니다.

---

## 🌟 주요 기능 (Key Features)

1. **Header**:
   - Title: `Little Bridge`
   - Subtitle: `Say it naturally. Grow with two languages.`
   - Gemini 4 Argon API 키 설정 모달 지원

2. **Onboarding / Profile Section**:
   - **Parenting Style Select**: `Kind & Firm (Default)`, `Short & Direct`, `Warm & Gentle`
   - **Child Age Select**: `1-2 years`, `3-4 years (Default)`, `5+ years`

3. **Main Input Section**:
   - **Parent's Korean Input**: 기본 예시 `"장난감 던지면 안 돼. 바닥에 내려놓고 놀자."`
   - **Situation Selector**: `Playground`, `Mealtime`, `Toy Play`
   - **Generate Parent Voice** 버튼

4. **Output Card Section**:
   - **Direct Translation (Literal)**: 직역 비교
   - **Natural Parent English (Styled)**: 양육 스타일과 연령에 맞춘 원어민 부모 영어 표현
   - **Audio Script (Clean text without special characters)**: 특수문자/이모지가 제거된 음성 합성용 클린 텍스트
   - **Reason for recommendation (Korean explanation)**: 발달 심리학 및 양육 스타일 기반 한국어 코칭 설명
   - **Follow-up Question**: 아이와 대화를 이어가는 영어 질문
   - **🔊 Listen in Parent Voice**: 브라우저 `window.speechSynthesis` API를 활용한 원어민 음성 재생 (속도 조절 지원)

5. **Gemini 4 Argon API Integration**:
   - `@google/genai` SDK (`GoogleGenAI`) 연동
   - 모델: `gemini-4-argon`
   - 설정: `response_mime_type: "application/json"`, `thinking_level: "medium"`

---

## 🚀 로컬 실행 및 프로덕션 빌드

```bash
cd /Users/parkjiyeong/.gemini/antigravity/scratch/little-bridge

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 프리뷰 서버 (http://localhost:4173)
npm run preview
```

---

## ☁️ 배포 가이드 (Firebase Hosting / Cloud Run)

### 옵션 A: Firebase Hosting 배포
프로젝트 루트에 [firebase.json](file:///Users/parkjiyeong/.gemini/antigravity/scratch/little-bridge/firebase.json) 설정이 포함되어 있습니다.
```bash
npm run build
npx firebase-tools login
npx firebase-tools init hosting
npx firebase-tools deploy --only hosting
```

### 옵션 B: Google Cloud Run 배포
프로젝트 루트에 Nginx 기반 멀티스테이지 [Dockerfile](file:///Users/parkjiyeong/.gemini/antigravity/scratch/little-bridge/Dockerfile)이 포함되어 있습니다.
```bash
gcloud run deploy little-bridge \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated
```
