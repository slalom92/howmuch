import { useEffect, useState } from 'react'
import { track } from '../lib/analytics.js'

// 다른 돈미터 계산기로 보내는 떠 있는 버튼 (오른쪽 아래, 하단 고정 광고 위)
// 아래로 스크롤하는 동안은 아이콘만 남기고 접어 본문을 덜 가린다.
//
// 정책 메모: 광고 위에 겹치거나 광고처럼 보이면 안 되므로 --anchor-h 만큼 띄우고 "광고" 표시를 하지 않는다.

// 축의금 봉투 아이콘
export function GiftEnvelopeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="5" y="4" width="22" height="25" rx="2.5" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M5 8.5l11 7 11-7" fill="none" strokeWidth="2" strokeLinejoin="round" style={{ stroke: 'var(--seal)' }} />
      <text x="16" y="26" textAnchor="middle" fontSize="9" fontWeight="700" style={{ fill: 'var(--seal)' }}>
        祝
      </text>
    </svg>
  )
}

// 유튜버 수익 아이콘: 화면 속 ₩ 동전 (특정 서비스 로고처럼 보이지 않게 일반 기호만 쓴다)
export function CreatorIncomeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="3.5" y="6" width="25" height="17" rx="3" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M11 28h10M16 23v5" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <circle cx="16" cy="14.5" r="5.5" strokeWidth="1.6" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <path d="M13.4 12.4l.9 4.2 1.7-3.2 1.7 3.2.9-4.2M12.9 14.2h6.2" fill="none" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--seal)' }} />
    </svg>
  )
}

// hidden: 잠시 숨길 때 (예: 축의금 계산기에서 하단 요약 바가 떠 있는 동안)
export default function FloatingLink({ href, title, sub, badge, icon, hidden = false, event = 'floating_link' }) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        // 맨 위 근처이거나 위로 올리면 펼치고, 아래로 내리면 접는다
        if (y < 120 || y < last - 4) setCompact(false)
        else if (y > last + 4) setCompact(true)
        last = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      className={`float-link${compact ? ' is-compact' : ''}${hidden ? ' is-hidden' : ''}`}
      href={href}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      aria-label={sub ? `${title} – ${sub}` : title}
      onClick={() => track(event, { link_url: href })}
    >
      <span className="float-link__icon">{icon}</span>
      <span className="float-link__text" aria-hidden="true">
        <strong>{title}</strong>
        {sub && <span>{sub}</span>}
      </span>
      {badge && (
        <span className="float-link__badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </a>
  )
}
