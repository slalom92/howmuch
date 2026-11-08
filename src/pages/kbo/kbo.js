// 프로야구(KBO) 선수 연봉 자료
//
// - 금액 단위는 "만 원"이다. 연봉은 그해 소속 선수 등록 기준이며 계약금·옵션(인센티브)은 들어 있지 않다.
// - KBO는 전체 선수 연봉표를 공개하지 않고, 평균·상위 선수만 보도자료로 알린다.
//   그래서 KBO 발표와 구단 공식 발표를 옮긴 기사에서 확인한 선수만 넣었다. 선수마다 출처를 단다.
// - 새 시즌 자료가 나오면 SEASON, LEAGUE, TEAMS, PLAYERS 숫자만 바꾸면 된다.

export const SEASON = 2026
export const GAMES = 144 // 정규시즌 팀당 경기 수
export const INNINGS = 9 // 한 경기 정규 이닝

// 출처 (기사 제목은 옮기지 않고 매체와 발표 주체만 적는다)
export const SOURCES = {
  kbo: { label: 'KBO 2026 선수단 등록·연봉 현황 발표 (2026.3.18)', url: 'https://www.koreabaseball.com/MediaNews/Notice/View.aspx?bdSe=11861' },
  kbo_top: { label: '연합뉴스·경기일보, KBO 2026 연봉 발표 보도', url: 'https://www.kyeonggi.com/article/20260318580259' },
  kbo_x: { label: '엑스포츠뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.xportsnews.com/article/2124498' },
  kbo_star: { label: '스타뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.starnewskorea.com/sports/2026/03/18/2026031813522141894' },
  yang: { label: '스포츠경향, KBO 2026 연봉 발표 보도', url: 'https://sports.khan.co.kr/article/202603181513003/' },
  choi_hw: { label: '톱스타뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.topstarnews.net/news/articleView.html?idxno=16008453' },
  lg: { label: 'LG트윈스 2026시즌 연봉 계약 발표', url: 'https://lg.co.kr/media/release/29793' },
  lg_osen: { label: 'OSEN, LG 샐러리캡 분석 (2026.1.5)', url: 'https://osen.co.kr/article/G1112723323' },
  hanwha: { label: '스타뉴스, 한화 2026 연봉 계약 발표 보도', url: 'https://www.starnewskorea.com/sports/2026/01/21/2026012119084141185' },
  hanwha_x: { label: '엑스포츠뉴스, 한화 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103107' },
  samsung: { label: '엑스포츠뉴스, 삼성 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2104333' },
  kia: { label: 'OSEN, KIA 2026 연봉 계약 발표 보도', url: 'https://osen.co.kr/article/G1112728955' },
  kt: { label: '파이낸셜뉴스, KT 2026 연봉 계약 발표 보도', url: 'https://www.fnnews.com/news/202601151533125810' },
  nc: { label: '엑스포츠뉴스, NC 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103524' },
  ssg: { label: 'OSEN, SSG 2026 연봉 계약 발표 보도', url: 'https://osen.co.kr/article/G1112737552' },
  ssg_twig: { label: 'twig24, SSG 2026 연봉 계약 보도', url: 'https://www.twig24.com/news/2026/02/01/20260201500002' },
  ssg_newsis: { label: '뉴시스, SSG 2026 연봉 계약 발표 보도', url: 'https://www.newsis.com/view/NISX20260131_0003497621' },
  ssg_kim: { label: '데일리안, SSG 김광현 연장 계약 보도 (2025.6.13)', url: 'https://www.dailian.co.kr/news/view/1510049/' },
  kiwoom: { label: '엑스포츠뉴스, 키움 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2102671' },
  kiwoom_lee: { label: '엑스포츠뉴스, 키움 2026 연봉 계약 보도', url: 'https://www.xportsnews.com/article/2102715' },
  doosan_kwak: { label: 'OSEN, 두산 곽빈 연봉 보도', url: 'https://osen.co.kr/article/G1112735603' },
  doosan_kim: { label: 'OSEN, 두산 김택연 연봉 보도', url: 'https://osen.co.kr/article/G1112734065' },
  doosan_oh: { label: '노컷뉴스, 두산 2026 연봉 계약 보도', url: 'https://nocutnews.co.kr/news/6459529' },
  lotte: { label: '엑스포츠뉴스, 롯데 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103416' },
  fa_park_hm: { label: '엑스포츠뉴스, LG 박해민 FA 계약 보도', url: 'https://www.xportsnews.com/article/2081215' },
  fa_kang: { label: '엑스포츠뉴스, 한화 강백호 FA 계약 보도', url: 'https://www.xportsnews.com/article/2080928' },
  fa_kim_hs: { label: '뉴시스, KT 김현수 FA 계약 보도', url: 'https://mobile.newsis.com/view/NISX20251125_0003416037' },
  fa_kt: { label: 'OSEN, KT 김현수·최원준 FA 계약 보도', url: 'https://osen.co.kr/article/G1112702530' },
  fa_list: { label: 'OSEN, 두산 박찬호·이영하·조수행 FA 계약 조건 보도', url: 'https://osen.co.kr/article/G1112718059' },
  fa_jang: { label: 'OSEN, LG 장현식 FA 계약 보도', url: 'https://osen.co.kr/article/G1112454831' },
  fa_choi_wt: { label: 'OSEN, 삼성 최원태 FA 계약 보도', url: 'https://osen.co.kr/article/G1112469896' },
  fa_eom: { label: 'OSEN, 한화 엄상백 FA 계약 보도', url: 'https://osen.co.kr/article/G1112453212' },
  fa_sim: { label: 'OSEN, 한화 심우준 FA 계약 보도', url: 'https://osen.co.kr/article/G1112452996' },
  fa_na: { label: '엑스포츠뉴스, KIA 나성범 FA 계약 보도', url: 'https://www.xportsnews.com/article/1527268' },
  fa_yoo: { label: '일간스포츠, 롯데 유강남 FA 계약 보도', url: 'https://isplus.com/article/view/isp202211210149' },
  koo: { label: '데일리안, 구자욱 2026 연봉 보도', url: 'https://www.dailian.co.kr/news/view/1672324/' },
  minimum: { label: '스포츠조선, KBO 최저 연봉 규정 보도', url: 'https://v.daum.net/v/1v6ZnzkPzQ' },
}

// 리그 전체 (신인·외국인·아시아쿼터 선수 제외 529명 기준)
export const LEAGUE = {
  average: 17536, // 평균 연봉
  prevAverage: 16071, // 2025년 평균
  players: 529,
  minimum: 3000, // KBO 규정 최저 연봉
  source: 'kbo',
}

// 구단별 소속 선수 평균 연봉 (KBO 발표)
export const TEAMS = [
  { id: 'ssg', name: 'SSG', full: 'SSG 랜더스', average: 20783 },
  { id: 'doosan', name: '두산', full: '두산 베어스', average: 20776 },
  { id: 'lg', name: 'LG', full: 'LG 트윈스', average: 20094 },
  { id: 'kt', name: 'KT', full: 'KT 위즈', average: 19878 },
  { id: 'samsung', name: '삼성', full: '삼성 라이온즈', average: 18863 },
  { id: 'lotte', name: '롯데', full: '롯데 자이언츠', average: 17654 },
  { id: 'hanwha', name: '한화', full: '한화 이글스', average: 17613 },
  { id: 'kia', name: 'KIA', full: 'KIA 타이거즈', average: 15623 },
  { id: 'nc', name: 'NC', full: 'NC 다이노스', average: 13168 },
  { id: 'kiwoom', name: '키움', full: '키움 히어로즈', average: 10022 },
]

export const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

// 선수 (2026 연봉 순)
// prev: 2025년 연봉, history: 해마다 받은 연봉, approx: 정확한 해당 연도 금액이 공개되지 않아 계약 조건으로 어림한 값
// stats: 2026 정규시즌 1군 최종 기록 (TVING 선수 기록, 정규시즌은 2026.10.12 종료). null 이면 1군 기록 없음
//   타자 { g 경기, ab 타수, h 안타, hr 홈런, rbi 타점, avg 타율 }, 투수 { g, w 승, l 패, sv 세이브, hld 홀드, ip 이닝, so 탈삼진, era 평균자책 }
// tving: TVING 선수 페이지 번호 (https://www.tving.com/sports/kbo/athlete/번호)
export const PLAYERS = [
  { name: '양의지', team: 'doosan', pos: '포수', pay: 420000, prev: 160000, history: { 2023: 30000, 2024: 50000, 2025: 160000, 2026: 420000 }, note: '2026 리그 연봉 1위. 4+2년 최대 152억 원 FA 계약 4년째로, 연봉이 해마다 크게 오르는 구조예요.', stats: { g: 135, ab: 449, h: 112, hr: 23, rbi: 79, avg: '0.249' }, tving: 76232, src: ['yang', 'kbo_top'] },
  { name: '고영표', team: 'kt', pos: '투수', pay: 260000, note: '2026 리그 연봉 2위, 투수 1위예요.', stats: { g: 29, w: 15, l: 7, sv: 0, hld: 0, ip: '172 2/3', so: 183, era: '3.28' }, tving: 64001, src: ['kbo_x', 'kbo_top'] },
  { name: '최정', team: 'ssg', pos: '내야수', pay: 220000, prev: 170000, note: '2026 리그 연봉 3위예요.', stats: { g: 71, ab: 255, h: 78, hr: 20, rbi: 57, avg: '0.306' }, tving: 75847, src: ['kbo_x', 'kbo_star'] },
  { name: '류현진', team: 'hanwha', pos: '투수', pay: 210000, note: '박세웅과 함께 리그 연봉 공동 4위예요.', stats: { g: 25, w: 9, l: 6, sv: 0, hld: 0, ip: '134 2/3', so: 115, era: '3.88' }, tving: 76715, src: ['kbo_x', 'kbo_top'] },
  { name: '박세웅', team: 'lotte', pos: '투수', pay: 210000, note: '류현진과 함께 리그 연봉 공동 4위, 롯데 1위예요.', stats: { g: 27, w: 3, l: 9, sv: 0, hld: 0, ip: '147 1/3', so: 127, era: '4.64' }, tving: 64021, src: ['kbo_x', 'kbo_top'] },
  { name: '김광현', team: 'ssg', pos: '투수', pay: 150000, prev: 300000, approx: true, note: '2026~2027년 2년 계약의 연봉 총액 30억 원을 해마다 같게 나눠 어림했어요. 해마다 받는 정확한 금액은 공개되지 않았어요.', stats: null, tving: 77829, src: ['ssg_kim'] },
  { name: '오지환', team: 'lg', pos: '내야수', pay: 140000, prev: 30000, history: { 2024: 30000, 2025: 30000, 2026: 140000 }, note: '야수 연봉 3위, LG 1위예요. 6년 FA 계약 3년째라 연봉이 크게 올랐어요.', stats: { g: 126, ab: 392, h: 95, hr: 14, rbi: 61, avg: '0.242' }, tving: 79109, src: ['kbo_x', 'lg_osen'] },
  { name: '원태인', team: 'samsung', pos: '투수', pay: 100000, prev: 63000, note: '8년 차 선수 최고 연봉 기록이에요.', stats: { g: 26, w: 7, l: 9, sv: 0, hld: 0, ip: '145 1/3', so: 117, era: '4.52' }, tving: 69446, src: ['samsung'] },
  { name: '노시환', team: 'hanwha', pos: '내야수', pay: 100000, prev: 33000, note: '한화 연봉 재계약 선수 중 최고 인상액(약 203%)이에요.', stats: { g: 127, ab: 505, h: 143, hr: 29, rbi: 96, avg: '0.283' }, tving: 69737, src: ['hanwha'] },
  { name: '구창모', team: 'nc', pos: '투수', pay: 90000, prev: 10000, note: '2026 연봉 인상률 1위(800%)예요.', stats: { g: 29, w: 12, l: 8, sv: 0, hld: 0, ip: '163', so: 133, era: '4.03' }, tving: 65933, src: ['yang'] },
  { name: '홍창기', team: 'lg', pos: '외야수', pay: 52000, prev: 65000, stats: { g: 128, ab: 415, h: 99, hr: 0, rbi: 33, avg: '0.239' }, tving: 66108, src: ['lg'] },
  { name: '박동원', team: 'lg', pos: '포수', pay: 50000, prev: 120000, note: 'FA 계약 마지막 해라 연봉이 줄었어요.', stats: { g: 128, ab: 346, h: 78, hr: 14, rbi: 56, avg: '0.225' }, tving: 79365, src: ['lg_osen'] },
  { name: '문보경', team: 'lg', pos: '내야수', pay: 48000, prev: 41000, stats: { g: 108, ab: 357, h: 92, hr: 10, rbi: 60, avg: '0.258' }, tving: 69102, src: ['lg'] },
  { name: '안우진', team: 'kiwoom', pos: '투수', pay: 48000, prev: 48000, note: '키움 연봉 재계약 선수 중 최고 연봉이에요.', stats: { g: 23, w: 5, l: 8, sv: 0, hld: 0, ip: '112', so: 132, era: '3.54' }, tving: 68341, src: ['kiwoom'] },
  { name: '김진성', team: 'lg', pos: '투수', pay: 45000, prev: 33000, note: 'LG 구단 첫 다년 계약(3년 최대 16억 원)이에요.', stats: { g: 53, w: 6, l: 2, sv: 1, hld: 18, ip: '47 1/3', so: 35, era: '4.94' }, tving: 75867, src: ['lg'] },
  { name: '박성한', team: 'ssg', pos: '내야수', pay: 42000, prev: 37000, stats: { g: 144, ab: 530, h: 175, hr: 5, rbi: 71, avg: '0.330' }, tving: 67893, src: ['ssg_twig'] },
  { name: '최형우', team: 'samsung', pos: '외야수', pay: 40000, note: 'KBO 첫 25년 차 연봉 선수이자 2026 최고령 선수예요.', stats: { g: 137, ab: 491, h: 148, hr: 18, rbi: 106, avg: '0.301' }, tving: 72443, src: ['choi_hw'] },
  { name: '신민재', team: 'lg', pos: '내야수', pay: 38000, prev: 20000, note: 'LG 재계약 선수 중 최고 인상액이에요.', stats: { g: 138, ab: 399, h: 100, hr: 0, rbi: 26, avg: '0.251' }, tving: 65207, src: ['lg'] },
  { name: '최지훈', team: 'ssg', pos: '외야수', pay: 37000, prev: 30000, stats: { g: 141, ab: 519, h: 130, hr: 13, rbi: 64, avg: '0.250' }, tving: 50854, src: ['ssg'] },
  { name: '김주원', team: 'nc', pos: '내야수', pay: 35000, prev: 20000, note: 'NC 재계약 선수 중 최고 연봉이에요.', stats: { g: 131, ab: 517, h: 145, hr: 18, rbi: 61, avg: '0.280' }, tving: 51907, src: ['nc'] },
  { name: '곽빈', team: 'doosan', pos: '투수', pay: 30500, prev: 38000, stats: { g: 27, w: 11, l: 7, sv: 0, hld: 0, ip: '161', so: 197, era: '2.24' }, tving: 68220, src: ['doosan_kwak'] },
  { name: '김도영', team: 'kia', pos: '내야수', pay: 25000, prev: 50000, note: '2025년 연봉에서 절반(50%)이 깎였어요.', stats: { g: 135, ab: 496, h: 153, hr: 45, rbi: 118, avg: '0.308' }, tving: 52605, src: ['kia'] },
  { name: '김택연', team: 'doosan', pos: '투수', pay: 22000, prev: 14000, stats: { g: 55, w: 3, l: 3, sv: 4, hld: 13, ip: '56 2/3', so: 73, era: '2.54' }, tving: 54263, src: ['doosan_kim'] },
  { name: '하영민', team: 'kiwoom', pos: '투수', pay: 21000, stats: { g: 27, w: 8, l: 9, sv: 0, hld: 0, ip: '134', so: 115, era: '4.37' }, tving: 64350, src: ['kiwoom'] },
  { name: '이로운', team: 'ssg', pos: '투수', pay: 20000, prev: 7400, note: 'SSG 재계약 선수 중 최고 인상액이에요.', stats: { g: 50, w: 8, l: 4, sv: 0, hld: 7, ip: '69', so: 66, era: '5.61' }, tving: 53892, src: ['ssg_newsis'] },
  { name: '안현민', team: 'kt', pos: '외야수', pay: 18000, prev: 3300, note: 'KT 구단 역대 최고 인상률(445.5%)이에요.', stats: { g: 94, ab: 326, h: 97, hr: 14, rbi: 63, avg: '0.298' }, tving: 52001, src: ['kt'] },
  { name: '김서현', team: 'hanwha', pos: '투수', pay: 16800, prev: 5600, stats: { g: 30, w: 1, l: 4, sv: 2, hld: 0, ip: '26', so: 28, era: '6.92' }, tving: 53754, src: ['hanwha_x'] },
  { name: '송승기', team: 'lg', pos: '투수', pay: 13600, prev: 3600, note: 'LG 재계약 선수 중 최고 인상률(277.8%)이에요.', stats: { g: 16, w: 3, l: 3, sv: 0, hld: 0, ip: '70', so: 54, era: '5.53' }, tving: 51111, src: ['lg'] },
  { name: '전사민', team: 'nc', pos: '투수', pay: 13000, prev: 3800, stats: { g: 69, w: 6, l: 6, sv: 10, hld: 6, ip: '63', so: 46, era: '5.43' }, tving: 69969, src: ['nc'] },
  { name: '이용규', team: 'kiwoom', pos: '외야수', pay: 12000, prev: 20000, note: '플레잉코치를 겸하는 시즌이에요.', stats: null, src: ['kiwoom_lee'] },
  { name: '오명진', team: 'doosan', pos: '내야수', pay: 11200, prev: 3100, note: '두산 재계약 선수 중 최고 인상률(261.3%)이에요.', stats: { g: 77, ab: 142, h: 35, hr: 3, rbi: 17, avg: '0.246' }, tving: 50208, src: ['doosan_oh'] },
  { name: '전민재', team: 'lotte', pos: '내야수', pay: 11000, prev: 7500, note: '데뷔 뒤 첫 억대 연봉이에요.', stats: { g: 140, ab: 472, h: 131, hr: 9, rbi: 70, avg: '0.278' }, tving: 68205, src: ['lotte'] },
  { name: '이지강', team: 'lg', pos: '투수', pay: 11000, note: '데뷔 뒤 첫 억대 연봉이에요.', stats: null, tving: 69108, src: ['lg'] },
  { name: '임지열', team: 'kiwoom', pos: '외야수', pay: 11000, stats: { g: 31, ab: 72, h: 15, hr: 1, rbi: 4, avg: '0.208' }, tving: 64340, src: ['kiwoom'] },
  // 아래는 FA·다년 계약 조건으로 어림한 선수 (approx: true)
  { name: '나성범', team: 'kia', pos: '외야수', pay: 100000, approx: true, note: '2022~2027년 6년 계약의 연봉 총액 60억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 140, ab: 508, h: 154, hr: 31, rbi: 97, avg: '0.303' }, tving: 62947, src: ['fa_na'] },
  { name: '장현식', team: 'lg', pos: '투수', pay: 90000, approx: true, note: '2025~2028년 4년 계약의 연봉 총액 36억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 32, w: 7, l: 3, sv: 2, hld: 7, ip: '53 2/3', so: 39, era: '4.02' }, tving: 63950, src: ['fa_jang'] },
  { name: '최원태', team: 'samsung', pos: '투수', pay: 85000, approx: true, note: '2025~2028년 4년 계약의 연봉 총액 34억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 24, w: 7, l: 5, sv: 0, hld: 0, ip: '125', so: 119, era: '4.68' }, tving: 65320, src: ['fa_choi_wt'] },
  { name: '유강남', team: 'lotte', pos: '포수', pay: 85000, approx: true, note: '2023~2026년 4년 계약의 연봉 총액 34억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 58, ab: 122, h: 27, hr: 3, rbi: 9, avg: '0.221' }, tving: 61102, src: ['fa_yoo'] },
  { name: '엄상백', team: 'hanwha', pos: '투수', pay: 81300, approx: true, note: '2025~2028년 4년 계약의 연봉 총액 32억 5천만 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: null, statsNote: '2026 정규시즌 1군 등판이 1경기(⅓이닝)뿐이라 기록 하나당 금액은 계산하지 않았어요.', tving: 65056, src: ['fa_eom'] },
  { name: '강백호', team: 'hanwha', pos: '내야수', pay: 75000, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 30억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 131, ab: 508, h: 145, hr: 34, rbi: 118, avg: '0.285' }, tving: 68050, src: ['fa_kang'] },
  { name: '박찬호', team: 'doosan', pos: '내야수', pay: 70000, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 28억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 143, ab: 537, h: 152, hr: 5, rbi: 54, avg: '0.283' }, tving: 64646, src: ['fa_list'] },
  { name: '김현수', team: 'kt', pos: '외야수', pay: 66700, approx: true, note: '2026~2028년 3년 계약의 연봉 총액 20억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 142, ab: 555, h: 159, hr: 14, rbi: 95, avg: '0.286' }, tving: 76290, src: ['fa_kim_hs'] },
  { name: '박해민', team: 'lg', pos: '외야수', pay: 62500, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 25억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 144, ab: 496, h: 143, hr: 5, rbi: 57, avg: '0.288' }, tving: 62415, src: ['fa_park_hm'] },
  { name: '이영하', team: 'doosan', pos: '투수', pay: 57500, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 23억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 61, w: 6, l: 5, sv: 26, hld: 0, ip: '68', so: 90, era: '3.18' }, tving: 66291, src: ['fa_list'] },
  { name: '최원준', team: 'kt', pos: '외야수', pay: 50000, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 20억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 140, ab: 585, h: 208, hr: 9, rbi: 74, avg: '0.356' }, tving: 66606, src: ['fa_kt'] },
  { name: '구자욱', team: 'samsung', pos: '외야수', pay: 50000, approx: true, note: '2022~2026년 비FA 다년 계약(보장 90억 원)의 마지막 해로, 언론이 보도한 ‘5억 원 수준’을 넣었어요. 정확한 금액은 공개되지 않았어요.', stats: { g: 114, ab: 420, h: 156, hr: 15, rbi: 102, avg: '0.371' }, tving: 62404, src: ['koo'] },
  { name: '심우준', team: 'hanwha', pos: '내야수', pay: 45000, approx: true, note: '2025~2028년 4년 계약의 연봉 총액 18억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 128, ab: 394, h: 104, hr: 7, rbi: 47, avg: '0.264' }, tving: 64006, src: ['fa_sim'] },
  { name: '조수행', team: 'doosan', pos: '외야수', pay: 20000, approx: true, note: '2026~2029년 4년 계약의 연봉 총액 8억 원을 해마다 같게 나눠 어림했어요. FA 계약은 해마다 받는 금액이 다른 경우가 많아 실제 2026년 연봉과 다를 수 있어요.', stats: { g: 119, ab: 189, h: 61, hr: 0, rbi: 21, avg: '0.323' }, tving: 66209, src: ['fa_list'] },
]
// 연봉 많은 순 (같으면 적은 순서대로). 순위와 기본 선수가 이 순서를 쓴다
PLAYERS.sort((x, y) => y.pay - x.pay)

// 투구수는 공개된 선수 기록에 없어 '이닝 × 이닝당 투구수'로 어림한다.
// 2025년 이닝당 투구수가 가장 적은 구단이 15.5개(LG)였다는 보도를 바탕으로, 리그 투수의 평균을 16개로 잡았다.
export const PITCHES_PER_INNING = 16
export const PITCH_SOURCE = { label: '문화일보, 2025시즌 초 LG 이닝당 투구수 15.5개(10개 구단 중 가장 적음) 보도', url: 'https://v.daum.net/v/9tGooDOJCr' }
export const STATS_SOURCE = (code) => ({ label: 'TVING 선수 기록, 2026 정규시즌', url: `https://www.tving.com/sports/kbo/athlete/${code}` })

// 직장인 평균 연봉 (국가데이터처 2024년 임금근로일자리 소득, 월 375만 원 × 12)
export const WORKER_YEAR = 4500

const MAN = 10000 // 만 원 → 원

// 연봉을 시간·경기 단위로 쪼갠다 (결과는 원 단위)
export function breakdown(payMan) {
  const year = payMan * MAN
  return {
    year,
    game: year / GAMES,
    inning: year / (GAMES * INNINGS),
    day: year / 365,
    hour: year / (365 * 24),
    second: year / (365 * 24 * 3600),
  }
}

// 선수 한 명의 결과 화면에 필요한 숫자
// "56 2/3" → 56.667
export function innings(ip) {
  const [whole, frac] = String(ip).split(' ')
  const [a, b] = (frac || '0/1').split('/').map(Number)
  return Number(whole) + (b ? a / b : 0)
}

// 기록 하나당 연봉 (원). 투수와 타자가 다르다. 기록이 0이면 그 칸은 빼고, 1군 기록이 없으면 null
export function perRecord(p) {
  const s = p.stats
  if (!s) return null
  const year = p.pay * MAN
  const each = (label, n, opts = {}) => ({ label, n, won: n > 0 ? year / n : null, ...opts })
  if ('h' in s) {
    return {
      kind: 'batter',
      line: `${s.g}경기 타율 ${s.avg.replace(/^0/, '')}, ${s.h}안타 ${s.hr}홈런 ${s.rbi}타점`,
      items: [each('안타 하나에', s.h, { unit: '안타' }), each('홈런 하나에', s.hr, { unit: '홈런' }), each('타점 하나에', s.rbi, { unit: '타점' })],
    }
  }
  const ip = innings(s.ip)
  const pitches = Math.round(ip * PITCHES_PER_INNING)
  // 선발은 승리, 마무리는 세이브, 셋업은 홀드가 가장 많다: 셋 중 많은 것 하나만 보여 준다
  const [mainLabel, mainN, mainUnit] = [['승리 하나에', s.w, '승'], ['세이브 하나에', s.sv, '세이브'], ['홀드 하나에', s.hld, '홀드']].sort((a, b) => b[1] - a[1])[0]
  return {
    kind: 'pitcher',
    line: `${s.g}경기 ${s.ip}이닝, ${s.w}승 ${s.l}패${s.sv ? ` ${s.sv}세이브` : ''}${s.hld ? ` ${s.hld}홀드` : ''}, 탈삼진 ${s.so}개, 평균자책 ${s.era}`,
    items: [
      each('공 하나에', pitches, { unit: '구', approx: true }),
      each('아웃 하나에', Math.round(ip * 3), { unit: '아웃' }),
      each('탈삼진 하나에', s.so, { unit: '탈삼진' }),
      each(mainLabel, mainN, { unit: mainUnit }),
    ],
  }
}

export function profile(p) {
  const team = TEAM_BY_ID[p.team]
  const b = breakdown(p.pay)
  const rank = PLAYERS.filter((x) => x.pay > p.pay).length + 1
  const change = p.prev ? (p.pay - p.prev) / p.prev : null
  return {
    player: p,
    team,
    b,
    rank,
    change,
    vsLeague: p.pay / LEAGUE.average,
    vsTeam: p.pay / team.average,
    vsWorker: p.pay / WORKER_YEAR,
    // 직장인 평균 연봉을 버는 데 걸리는 경기 수
    gamesForWorkerYear: (WORKER_YEAR * MAN) / b.game,
    rec: perRecord(p),
  }
}

// ---------- 이름 찾기 ----------

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// "양의지" → "ㅇㅇㅈ"
export function chosung(s) {
  return Array.from(s)
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
    })
    .join('')
}

const clean = (s) => String(s || '').replace(/\s+/g, '').toLowerCase()
const isChosungOnly = (s) => /^[ㄱ-ㅎ]+$/.test(s)

export function findExact(q) {
  const k = clean(q)
  return PLAYERS.find((p) => p.name === k) || null
}

// 이름(앞부분 우선) → 이름 일부 → 초성 → 팀 이름 순으로 찾는다
export function suggest(q, limit = 8) {
  const k = clean(q)
  if (!k) return []
  const scored = []
  for (const p of PLAYERS) {
    const team = TEAM_BY_ID[p.team]
    let s = 0
    if (p.name === k) s = 100
    else if (p.name.startsWith(k)) s = 80
    else if (p.name.includes(k)) s = 60
    else if (isChosungOnly(k) && chosung(p.name).startsWith(k)) s = 50
    else if (clean(team.name) === k || clean(team.full).includes(k)) s = 20
    if (s) scored.push({ p, s })
  }
  return scored
    .sort((a, b) => b.s - a.s || b.p.pay - a.p.pay)
    .slice(0, limit)
    .map((x) => x.p)
}
