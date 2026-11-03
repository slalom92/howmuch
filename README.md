# 유튜버 월급명세서

유튜버를 검색하면 구독자 수와 최근 영상 조회수로 일, 주, 월, 연 광고 수익을 추정하고 직장인 월급과 비교해 보여주는 SPA입니다. React와 Vite로 만들었습니다.

## 실행

```bash
npm install
# .env.local 파일을 만들고 YT_API_KEY=발급받은키 를 넣으세요 (커밋 금지)
npm run dev            # http://localhost:5173  (/api 서버 함수도 함께 동작)
npm run build
```

키 없이 화면만 보려면 `.env`에 `VITE_DEMO_MODE=true`를 넣으면 가상 채널로 동작합니다.

## 구조: 브라우저 → 서버 함수 → YouTube

```
브라우저 ──/api/search, /api/channel──▶ Vercel 서버 함수 ──▶ YouTube Data API
            (Vercel CDN 캐시: 검색 24시간, 채널 6시간)
```

- API 키는 서버 환경변수 `YT_API_KEY`에만 있고 브라우저 코드에는 들어가지 않습니다.
- 서버 응답에 `Cache-Control: s-maxage`를 붙여 Vercel CDN이 같은 요청 결과를 모든 방문자와 공유합니다. 인기 채널은 하루 한 번만 실제로 YouTube를 호출합니다.
- 브라우저에도 localStorage로 한 번 더 캐시합니다.
- 오류 응답(쿼터 초과 등)은 캐시하지 않습니다.

## 환경 변수

| 이름 | 위치 | 설명 |
|---|---|---|
| `YT_API_KEY` | Vercel 환경변수, 로컬은 `.env.local` | YouTube Data API v3 키 (비밀) |
| `VITE_ADSENSE_CLIENT` | `.env` | 애드센스 게시자 ID (`ca-pub-...`) |
| `VITE_AD_SLOT_TOP` / `VITE_AD_SLOT_INLINE` / `VITE_AD_SLOT_ANCHOR` | `.env` | 상단 배너, 본문, 하단 고정 광고 단위 ID |
| `VITE_DEMO_MODE` | `.env` | `true`면 가상 채널 데이터 사용 |
| `SITE_URL` | Vercel 환경변수 (선택) | 서버가 YouTube에 보내는 Referer. 기본값 `https://howmuchyoutube.blog/` |

### YouTube API 키

서버에서 쓰는 키는 브라우저에 노출되지 않으므로 HTTP 리퍼러 제한 대신 **API 제한사항(YouTube Data API v3만 허용)**만 걸어 두면 됩니다. 기존 리퍼러 제한 키도 서버가 사이트 주소를 Referer로 보내므로 그대로 동작합니다.

### 쿼터 (무료 기본값)

- 채널 이름 검색(`search.list`): 하루 약 100회로 따로 제한됩니다. 서버 캐시 덕분에 같은 검색어는 하루에 한 번만 셉니다.
- `@핸들`, 채널 주소, 채널 ID 입력은 이름 검색을 거치지 않습니다.
- 더 필요하면 YouTube API Services Audit and Quota Extension Form으로 증설을 신청합니다.

## 수익 계산 방식 (`src/lib/calc.js`)

1. 최근 업로드 영상 최대 50개를 가져와 3분 이하는 쇼츠, 나머지는 롱폼으로 나눕니다.
2. 유형별 평균 조회수(상·하위 10% 제외)와 한 달 업로드 수를 구합니다. 올린 지 3일이 안 된 영상은 조회수가 덜 쌓였으므로 평균에서 뺍니다.
3. 한 달 신규 조회수 = 평균 조회수 × 월 업로드 수
4. 수익 = 신규 조회수 ÷ 1,000 × RPM(1,000회당 크리에이터 수익)

RPM 가정값은 `RPM` 상수에서 바꿀 수 있습니다 (롱폼 1,000 / 2,000 / 3,500원, 쇼츠 50 / 100 / 200원).
협찬, 멤버십, 슈퍼챗, 예전 영상에서 계속 나오는 조회수는 포함하지 않습니다.

## 비교 소득 (`src/lib/compare.js`)

- 최저임금: 2026년 시급 10,320원 × 209시간 = 월 2,156,880원
- 직장인 평균 375만 원, 대기업 613만 원, 중소기업 307만 원: 국가데이터처 「2024년 임금근로일자리 소득(보수) 결과」 (세전 월평균)

새 통계가 나오면 이 파일의 숫자만 바꾸면 됩니다.

## 광고 배치와 애드센스 정책

- 상단 배너, 결과 아래 본문 광고, 하단 고정 광고 세 자리가 있습니다 (`src/components/AdSlot.jsx`).
- 하단 고정 광고는 본문을 가리지 않도록 페이지 아래에 그만큼 여백을 둡니다. 직접 만든 고정 광고 대신 애드센스 자동 광고의 **앵커 광고**를 켜는 방법도 있습니다.
- "광고를 눌러 주세요", "광고 클릭 시 추가 검색"처럼 클릭을 유도하는 문구나 장치는 애드센스 정책 위반이라 넣지 않았습니다.

## 구조

```
api/
  search.js               GET /api/search  채널 검색 (CDN 24시간 캐시)
  channel.js              GET /api/channel 채널 + 최근 영상 (CDN 6시간 캐시)
  _lib/youtube.js         YouTube API 호출 공용 코드
src/
  App.jsx                 화면 흐름 (검색 → 후보 선택 → 결과), ?c=채널ID 공유 링크
  components/
    SearchBar.jsx         검색창
    ChannelPicker.jsx     이름 검색 시 후보 채널 목록
    PayStub.jsx           급여명세서 형태의 결과 (기간, 광고 단가 전환)
    CompareChart.jsx      직장인 소득 비교 막대그래프 (라이브러리 없이 CSS)
    AdSlot.jsx            광고 영역
  lib/
    youtube.js            입력 해석, 서버 함수 호출, 브라우저 캐시
    calc.js               수익 추정
    compare.js            비교 소득 데이터
    demo.js               API 키 없을 때 쓰는 가상 채널
    format.js             만/억 단위 표기
```
