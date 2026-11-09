import { useEffect, useRef, useState } from 'react'
import { track } from '../lib/analytics.js'
import { YOUTUBER, WEDDING_GIFT, KBO, KLPGA, APT } from '../lib/menu.js'
import { CreatorIncomeIcon, GiftEnvelopeIcon, BaseballIcon, GolfIcon, HouseIcon } from './FloatingLink.jsx'

// 다섯 콘텐츠(유튜버 수익, 축의금, 야구선수 연봉, 골프선수 상금, 연봉 모아 집 사기)를 오가는 떠 있는 버튼 (오른쪽 아래, 하단 고정 광고 위)
// 누르면 위로 목록이 펼쳐진다. 모양은 FloatingLink(.float-link)를 그대로 쓰고, 목록만 .float-switch__menu 로 더한다.
// 아래로 스크롤하는 동안은 아이콘만 남기고 접어 본문을 덜 가린다.
//
// 정책 메모: 광고 위에 겹치거나 광고처럼 보이면 안 되므로 --anchor-h 만큼 띄우고 "광고" 표시를 하지 않는다.

export const APPS = [
  { href: YOUTUBER, title: '유튜버 수익 보기', short: '유튜버', sub: '한 달 광고 수익 계산', Icon: CreatorIncomeIcon },
  { href: WEDDING_GIFT, title: '축의금 얼마?', short: '축의금', sub: '관계별 적정 금액 계산', Icon: GiftEnvelopeIcon },
  { href: KBO, title: '야구선수 연봉 보기', short: '야구 연봉', sub: '1경기, 안타 하나에 얼마', Icon: BaseballIcon, badge: 'NEW' },
  { href: KLPGA, title: '골프선수 상금 보기', short: '골프 상금', sub: '시즌 상금, 하루에 얼마', Icon: GolfIcon, badge: 'NEW' },
  { href: APT, title: '연봉 모아 집 사기', short: '집 사기', sub: '몇 년 모으면 이 아파트', Icon: HouseIcon, badge: 'NEW' },
]

function Chevron({ open }) {
  return (
    <svg className={`float-switch__chev${open ? ' is-open' : ''}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 10L8 5.5l4.5 4.5" />
    </svg>
  )
}

// current: 지금 보고 있는 콘텐츠의 주소, hidden: 잠시 숨길 때 (예: 결과 요약 바가 떠 있는 동안)
export default function FloatingSwitch({ current, hidden = false }) {
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const others = APPS.filter((a) => a.href !== current)

  // 아래로 내리면 접고, 위로 올리거나 맨 위 근처면 펼친다 (목록이 열려 있으면 그대로 둔다)
  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 120 || y < last - 4) setCompact(false)
        else if (y > last + 4) setCompact(true)
        last = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 바깥을 누르거나 Esc 를 누르면 닫는다
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 숨겨질 때는 목록도 닫는다
  useEffect(() => {
    if (hidden) setOpen(false)
  }, [hidden])

  const toggle = () => {
    setOpen((v) => {
      if (!v) track('floating_switch_open', { from: current })
      return !v
    })
  }

  const cls = ['float-switch', compact && !open ? 'is-compact' : '', hidden ? 'is-hidden' : '', open ? 'is-open' : ''].filter(Boolean).join(' ')

  return (
    <div className={cls} ref={rootRef} aria-hidden={hidden || undefined}>
      <nav id="float-switch-menu" className="float-switch__menu" aria-label="돈미터 계산기" hidden={!open}>
        <p className="float-switch__head">돈미터의 다른 계산기</p>
        <ul>
          {APPS.map(({ href, title, sub, Icon, badge }) => {
            const here = href === current
            return (
              <li key={href}>
                <a
                  href={href}
                  className={`float-switch__item${here ? ' is-here' : ''}`}
                  aria-current={here ? 'page' : undefined}
                  tabIndex={open ? undefined : -1}
                  onClick={(e) => {
                    if (here) {
                      e.preventDefault()
                      setOpen(false)
                      return
                    }
                    track('floating_link', { link_url: href, from: current })
                  }}
                >
                  <span className="float-link__icon">
                    <Icon />
                  </span>
                  <span className="float-switch__text">
                    <strong>{title}</strong>
                    <span>{sub}</span>
                  </span>
                  {here ? (
                    <span className="float-switch__tag">지금 보는 중</span>
                  ) : (
                    badge && <span className="float-switch__tag float-switch__tag--new">{badge}</span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        ref={btnRef}
        className="float-link float-switch__btn"
        aria-expanded={open}
        aria-controls="float-switch-menu"
        aria-label={`다른 계산기 보기: ${others.map((a) => a.title).join(', ')}`}
        tabIndex={hidden ? -1 : undefined}
        onClick={toggle}
      >
        <span className="float-switch__icons" aria-hidden="true">
          {others.map(({ href, Icon }) => (
            <span key={href} className="float-link__icon">
              <Icon />
            </span>
          ))}
        </span>
        <span className="float-link__text" aria-hidden="true">
          <strong>다른 계산기</strong>
          <span>{others.map((a) => a.short).join(', ')}</span>
        </span>
        <Chevron open={open} />
      </button>
    </div>
  )
}
