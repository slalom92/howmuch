// 월급 분당 계산기 물건 아이콘 (상표 없는 일반 그림). 색은 테마 변수를 따른다.

// 영화표 모양 (양옆이 파인 직사각형)
const TICKET = 'M3.4 7.4a1.4 1.4 0 0 1 1.4-1.4h14.4a1.4 1.4 0 0 1 1.4 1.4v2.4a2.2 2.2 0 0 0 0 4.4v2.4a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4v-2.4a2.2 2.2 0 0 0 0-4.4z'

const ART = {
  // 테이크아웃 커피 컵
  coffee: (
    <>
      <path d="M6.5 8.5h11l-1.3 12.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M5.5 6.2h13v2.3h-13z" style={{ fill: 'var(--paper)' }} />
      <path d="M8 4.5c0-.8.6-1.5 1.4-1.5h5.2c.8 0 1.4.7 1.4 1.5v1.7H8z" style={{ fill: 'var(--paper)' }} />
      <path d="M7.4 12.5h9.2l-.5 4.5H7.9z" style={{ fill: 'var(--paper)' }} />
    </>
  ),
  // 닭다리 (튀김옷 + 뼈)
  chicken: (
    <>
      <path d="M5.4 17.3l-1.6 1.6a1.6 1.6 0 1 0 1.3 2.6 1.6 1.6 0 1 0 2.6 1.3l1.6-1.6" style={{ fill: 'var(--paper)' }} />
      <path d="M13.6 2.6c4.3 0 7.8 3.2 7.8 7.3 0 4.6-3.8 7.9-8.2 7.9-1.3 0-2.3.4-3.1 1.2l-.8.8-4-4 .8-.8c.8-.8 1.2-1.8 1.2-3.1C7.3 6.4 10 2.6 13.6 2.6z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M12.2 6.6l.9.6M16.4 6.2l.4 1M17.8 10.6l.9.5M13.4 11l.6.8M10.8 9.6l.9.2" fill="none" />
    </>
  ),
  // 스마트폰
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.4" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="8.2" y="5.2" width="7.6" height="12.6" rx="0.8" style={{ fill: 'var(--paper)' }} />
      <path d="M10.8 3.9h2.4M10.5 19.6h3" fill="none" />
    </>
  ),
  // 지하철 (앞모습)
  train: (
    <>
      <rect x="5" y="2.8" width="14" height="15.4" rx="3.2" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="7.4" y="5.6" width="9.2" height="5.4" rx="1" style={{ fill: 'var(--paper)' }} />
      <circle cx="8.9" cy="14.4" r="1" style={{ fill: 'var(--paper)' }} />
      <circle cx="15.1" cy="14.4" r="1" style={{ fill: 'var(--paper)' }} />
      <path d="M8.4 18.2l-2.4 3.3M15.6 18.2l2.4 3.3M7.3 20h9.4" fill="none" />
    </>
  ),
  // 김밥 (단면)
  gimbap: (
    <>
      <circle cx="12" cy="12" r="8.8" style={{ fill: 'var(--seal-tint)' }} />
      <circle cx="12" cy="12" r="6" style={{ fill: 'var(--paper)' }} />
      <rect x="9.2" y="9.4" width="2.4" height="2.4" rx="0.5" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="12.6" y="12.2" width="2.4" height="2.4" rx="0.5" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M13 9.6h1.6M9.6 13.6v1.4" fill="none" />
    </>
  ),
  // 짜장면: 그릇 + 젓가락
  noodles: (
    <>
      <path d="M17.6 2.8l-4.2 8.4M20.6 4.2l-5.6 7" fill="none" />
      <path d="M3.4 11.4h17.2a8.6 8.6 0 0 1-17.2 0z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M6.4 11.4c0-1.6 1.4-1.6 1.4 0s1.4 1.6 1.4 0 1.4-1.6 1.4 0 1.4 1.6 1.4 0" fill="none" />
      <path d="M9 21h6" fill="none" />
    </>
  ),
  // 냉면: 그릇 + 삶은 달걀 반쪽 + 얼음
  coldnoodle: (
    <>
      <rect x="13.2" y="5.4" width="4.4" height="4.4" rx="0.8" transform="rotate(12 15.4 7.6)" style={{ fill: 'var(--paper)' }} />
      <path d="M6.2 11.4a3.2 3.2 0 0 1 6.4 0z" style={{ fill: 'var(--paper)' }} />
      <circle cx="9.4" cy="10.2" r="1" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M3.4 11.4h17.2a8.6 8.6 0 0 1-17.2 0z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M7 15.2c1.6-.9 3.4.9 5 0s3.4.9 5 0" fill="none" />
      <path d="M9 21h6" fill="none" />
    </>
  ),
  // 찌개 냄비 + 김
  pot: (
    <>
      <path d="M8.6 2.8c-.9.9.9 1.8 0 3.2M12 2.8c-.9.9.9 1.8 0 3.2M15.4 2.8c-.9.9.9 1.8 0 3.2" fill="none" />
      <rect x="4.4" y="9" width="15.2" height="11" rx="2.6" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M2.4 11.6h2M19.6 11.6h2M4.4 12.6h15.2" fill="none" />
    </>
  ),
  // 삼계탕 뚝배기: 닭다리 뼈 + 김
  samgye: (
    <>
      <path d="M6.6 2.8c-.9.9.9 1.8 0 3.2M10 2.8c-.9.9.9 1.8 0 3.2" fill="none" />
      <path d="M14 11l2.6-4.6" fill="none" />
      <circle cx="17" cy="5.2" r="1.3" style={{ fill: 'var(--paper)' }} />
      <circle cx="18.4" cy="6.3" r="1.3" style={{ fill: 'var(--paper)' }} />
      <path d="M3 10.6h18v1.2a6.6 6.6 0 0 1-6.6 6.6H9.6A6.6 6.6 0 0 1 3 11.8z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M7.2 18.2l-.6 2.6M16.8 18.2l.6 2.6" fill="none" />
    </>
  ),
  // TV + 재생 버튼 (영상 구독)
  tv: (
    <>
      <rect x="2.8" y="4.4" width="18.4" height="12.6" rx="2" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="5" y="6.6" width="14" height="8.2" rx="0.8" style={{ fill: 'var(--paper)' }} />
      <path d="M10.6 8.8l3.8 1.9-3.8 1.9z" style={{ fill: 'var(--seal)' }} />
      <path d="M12 17v3.4M8.6 20.6h6.8" fill="none" />
    </>
  ),
  // 영화표 한 장
  ticket: (
    <>
      <path d={TICKET} style={{ fill: 'var(--seal-tint)' }} />
      <path d="M15.6 6.6v10.8" fill="none" strokeDasharray="1.4 1.8" />
      <path d="M8.6 10.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" style={{ fill: 'var(--paper)' }} strokeWidth="1.2" />
    </>
  ),
  // 영화표 두 장
  tickets: (
    <>
      <g transform="rotate(-10 9 9) translate(-0.6 -1.8) scale(0.84)" strokeWidth="1.9">
        <path d={TICKET} style={{ fill: 'var(--paper)' }} />
      </g>
      <g transform="translate(3.4 4.6) scale(0.84)" strokeWidth="1.9">
        <path d={TICKET} style={{ fill: 'var(--seal-tint)' }} />
        <path d="M15.6 6.6v10.8" fill="none" strokeDasharray="1.4 1.8" />
      </g>
    </>
  ),
  // 놀이공원 대관람차
  wheel: (
    <>
      <path d="M12 10.2l-4.6 11M12 10.2l4.6 11M5 21.2h14" fill="none" />
      <circle cx="12" cy="10.2" r="7" style={{ fill: 'var(--paper)' }} />
      <path d="M12 3.2v14M5 10.2h14M7 5.2l10 10M17 5.2l-10 10" fill="none" strokeWidth="1" />
      <circle cx="12" cy="10.2" r="1.5" style={{ fill: 'var(--seal-tint)' }} />
      <circle cx="12" cy="3.2" r="1.5" style={{ fill: 'var(--seal-tint)' }} />
      <circle cx="19" cy="10.2" r="1.5" style={{ fill: 'var(--seal-tint)' }} />
      <circle cx="5" cy="10.2" r="1.5" style={{ fill: 'var(--seal-tint)' }} />
      <circle cx="12" cy="17.2" r="1.5" style={{ fill: 'var(--seal-tint)' }} />
    </>
  ),
  // 주유기
  fuel: (
    <>
      <path d="M14.2 8.4h2.2a1.8 1.8 0 0 1 1.8 1.8v7a1.4 1.4 0 0 0 2.8 0V8.6l-2.6-2.6" fill="none" />
      <rect x="4" y="3.4" width="10.2" height="17.6" rx="1.6" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="6.2" y="5.8" width="5.8" height="4.6" rx="0.8" style={{ fill: 'var(--paper)' }} />
      <path d="M2.8 21h12.6" fill="none" />
    </>
  ),
  // 축의금 봉투
  envelope: (
    <>
      <rect x="5.6" y="2.8" width="12.8" height="18.4" rx="1.6" style={{ fill: 'var(--paper)' }} />
      <path d="M5.6 7.2l6.4 3.6 6.4-3.6" fill="none" />
      <path d="M12 18.4s-3.2-2-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2-3.2 4-3.2 4z" style={{ fill: 'var(--seal-tint)' }} />
    </>
  ),
  // 공연 가면 두 개
  masks: (
    <>
      <path d="M11 7.6c2.9 1.1 6.1 1.1 9 0v6.2c0 2.6-2 4.8-4.5 4.8S11 16.4 11 13.8z" style={{ fill: 'var(--paper)' }} />
      <path d="M13.4 11.2h1.4M16.4 11.2h1.4M13.8 16.2c1.1-.9 2.3-.9 3.4 0" fill="none" />
      <path d="M3.6 4.4c2.9 1.1 6.1 1.1 9 0v6.2c0 2.6-2 4.8-4.5 4.8S3.6 13.2 3.6 10.6z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M5.8 8.2h1.4M8.8 8.2h1.4M6.2 11.4c1.1.9 2.3.9 3.4 0" fill="none" />
    </>
  ),
  // 뷔페: 음식 덮개(클로슈)
  cloche: (
    <>
      <path d="M12 6.6v-1.4" fill="none" />
      <circle cx="12" cy="4.6" r="1.2" style={{ fill: 'var(--paper)' }} />
      <path d="M3.8 16.8a8.2 8.2 0 0 1 16.4 0z" style={{ fill: 'var(--seal-tint)' }} />
      <path d="M8 12.4a5 5 0 0 1 2.4-2.2" fill="none" />
      <rect x="2.4" y="16.8" width="19.2" height="2.6" rx="1.3" style={{ fill: 'var(--paper)' }} />
    </>
  ),
  // 무선 이어폰 한 쌍
  earbuds: (
    <>
      <rect x="6.6" y="7.6" width="2.8" height="12.6" rx="1.4" style={{ fill: 'var(--paper)' }} />
      <circle cx="7.6" cy="6.6" r="3.4" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="14.6" y="7.6" width="2.8" height="12.6" rx="1.4" style={{ fill: 'var(--paper)' }} />
      <circle cx="16.4" cy="6.6" r="3.4" style={{ fill: 'var(--seal-tint)' }} />
    </>
  ),
  // 집 (월세)
  house: (
    <>
      <path d="M3.6 11.2L12 3.6l8.4 7.6v9.2a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z" style={{ fill: 'var(--seal-tint)' }} />
      <rect x="9.8" y="14.2" width="4.4" height="7.2" rx="0.6" style={{ fill: 'var(--paper)' }} />
      <path d="M16.4 7.6V4.4h2.2v5.2" fill="none" />
    </>
  ),
}

export default function ItemIcon({ name, size = 22, className = 'jb-icon' }) {
  const art = ART[name]
  if (!art) return null
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--seal)' }}>
      {art}
    </svg>
  )
}
