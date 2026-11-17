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

// 야구공 아이콘 (실밥은 곡선 두 줄로만)
export function BaseballIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="12" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M9.2 6.6c2.6 2.4 3.9 5.6 3.9 9.4s-1.3 7-3.9 9.4M22.8 6.6c-2.6 2.4-3.9 5.6-3.9 9.4s1.3 7 3.9 9.4" fill="none" strokeWidth="1.6" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <path d="M10.6 9.6l1.8-.9M12 12.6l1.9-.5M12 19.4l1.9.5M10.6 22.4l1.8.9M21.4 9.6l-1.8-.9M20 12.6l-1.9-.5M20 19.4l-1.9.5M21.4 22.4l-1.8.9" fill="none" strokeWidth="1.2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
    </svg>
  )
}

export function GolfIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <ellipse cx="16" cy="25" rx="12" ry="4" strokeWidth="2" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <path d="M14 25V5" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <path d="M14.6 5.5l9.4 3.6-9.4 3.6z" strokeWidth="1.6" strokeLinejoin="round" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <circle cx="21.5" cy="22.2" r="2.2" strokeWidth="1.4" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
    </svg>
  )
}

// 집 한 채와 동전 (연봉 모아 집 사기)
export function HouseIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M4.5 15L16 5.5 27.5 15" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--seal)' }} />
      <path d="M7.5 13v14h17V13" strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <rect x="13" y="18.5" width="6" height="8.5" rx="0.8" strokeWidth="1.6" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <circle cx="24.5" cy="24.5" r="4.5" strokeWidth="1.6" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M24.5 22.3v4.4" fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
    </svg>
  )
}

// 존버 계산기: 달력 + 동전
export function CalendarIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="3.5" y="7" width="22" height="19.5" rx="2.5" strokeWidth="2" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <path d="M3.5 12.5h22M9 4.5v5M20 4.5v5" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <path d="M8.5 17h2M13.5 17h2M18.5 17h2M8.5 21.5h2M13.5 21.5h2" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <circle cx="24.5" cy="24.5" r="4.5" strokeWidth="1.6" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M24.5 22.3v4.4" fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
    </svg>
  )
}

// 직주근접 계산기: 지하철 앞모습
export function SubwayIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="7" y="3.5" width="18" height="21" rx="4.5" strokeWidth="2" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <rect x="10.5" y="7.5" width="11" height="6" rx="1.5" strokeWidth="1.8" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <circle cx="11.8" cy="19" r="1.6" style={{ fill: 'var(--seal)' }} />
      <circle cx="20.2" cy="19" r="1.6" style={{ fill: 'var(--seal)' }} />
      <path d="M11.5 24.5l-3.5 4.5M20.5 24.5l3.5 4.5M10 27h12" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
    </svg>
  )
}

// 자차 계산기: 옆에서 본 자동차
export function CarIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M3.5 21.5v-4.2c0-1 .6-1.8 1.6-2.1l3.4-1 3-4.6c.5-.7 1.2-1.1 2-1.1h6.2c.8 0 1.5.3 2 .9l3.8 4.6 2.4.6c1 .3 1.6 1.1 1.6 2.1v4.8c0 .8-.7 1.5-1.5 1.5H5c-.8 0-1.5-.7-1.5-1.5z" strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <path d="M12.5 10.8l-2.6 3.8h5.8v-3.8zM18.3 10.8v3.8h5.4l-3.1-3.8z" strokeWidth="1.5" strokeLinejoin="round" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <circle cx="9.5" cy="23" r="3" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <circle cx="22.5" cy="23" r="3" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
    </svg>
  )
}

// 월급 분당 계산기: 시계 + 동전
export function ClockIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M12.5 3.5h7M16 3.5v3" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
      <circle cx="15" cy="17.5" r="10.5" strokeWidth="2" style={{ fill: 'var(--seal-tint)', stroke: 'var(--seal)' }} />
      <path d="M15 11.5v6.5l4 2.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--seal)' }} />
      <circle cx="24.5" cy="24.5" r="4.5" strokeWidth="1.6" style={{ fill: 'var(--paper)', stroke: 'var(--seal)' }} />
      <path d="M24.5 22.3v4.4" fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
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
