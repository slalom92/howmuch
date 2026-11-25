import { useEffect, useRef, useState } from 'react'
import { pick, IS_SERVER } from '../lib/sting.js'

// 결과 한눈에 보기 카드: 아이콘 + 한 줄 설명 + 큰 숫자 (예: "내 월급으로 한남더힐" / "285년")
// options 는 페이지 폴더의 sting.js 가 계산 결과로 만든 후보 [{ big, cap, label }] 이다.
// 처음 들어올 때 그중 하나를 무작위로 고르고, 숫자가 바뀌면 한 번 튀어 오른다.
// 미리 그린 HTML 에서는 자리만 잡아 두고 감춘다 (화면이 뜨면 고른 문구로 바뀌며 깜빡이지 않게)
// 스크롤해서 배너가 화면 위로 사라지면 같은 배너를 절반 높이로 맨 위에 붙여 둔다 (.sting-dock).
// 원래 배너는 제자리에 두므로 본문이 튀지 않는다. 모바일 가로 화면(높이가 낮을 때)에서는 CSS 로 숨긴다.
export default function StingHero({ options }) {
  const o = pick(options || [])
  const ref = useRef(null)
  const [stuck, setStuck] = useState(false)
  const has = !!(o && o.big)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [has])
  if (!has) return null
  const { big, cap, label } = o
  const long = cap.length > 13
  // 큰 숫자가 길면 한 줄에 들어가도록 줄인다
  const size = big.length > 10 ? ' is-xxs' : big.length > 7 ? ' is-xs' : big.length > 5 ? ' is-sm' : ''
  const face = (
    <>
      <span className="sting-hero__icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false">
          <ellipse cx="13" cy="9" rx="8" ry="3.2" />
          <path d="M5 9v5c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V9" />
          <path d="M5 14v5c0 1.8 3.6 3.2 8 3.2 1.2 0 2.3-.1 3.3-.3" />
          <circle cx="22.5" cy="21.5" r="6.5" />
          <path d="M20 21.5l1.8 1.8 3.2-3.6" />
        </svg>
      </span>
      <span className="sting-hero__body">
        <span className={`sting-hero__cap${long ? ' is-long' : ''}`} aria-hidden="true">
          {cap}
        </span>
        <span className={`sting-hero__big${size}`} key={big} aria-hidden="true">
          {big}
        </span>
      </span>
    </>
  )
  return (
    <>
      <div ref={ref} className={`sting-hero${IS_SERVER ? ' is-pending' : ''}`} role="img" aria-label={label || `${big}, ${cap}`}>
        {face}
      </div>
      {!IS_SERVER && (
        <div className={`sting-dock${stuck ? ' is-on' : ''}`} aria-hidden="true">
          <div className="sting-hero">{face}</div>
        </div>
      )}
    </>
  )
}
