// 존버 계산기 물건 아이콘 (상표 없는 일반 그림). 색은 테마 변수를 따른다.
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
