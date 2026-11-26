import { useEffect, useRef, useState } from 'react'
import { pick, IS_SERVER } from '../lib/sting.js'

// 맨 위 큰 배너: 유튜브 썸네일처럼 큰 숫자 하나 + 알약 모양 한 줄 (예: "285년" / "내 월급으로 한남더힐")
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
      <svg className="sting-hero__rays" viewBox="0 0 400 200" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2
          const r1 = 96 + (i % 3) * 8
          const r2 = 150 + (i % 2) * 34
          const x = (r) => (200 + Math.cos(a) * r * 1.5).toFixed(1)
          const y = (r) => (96 + Math.sin(a) * r * 0.62).toFixed(1)
          return <line key={i} x1={x(r1)} y1={y(r1)} x2={x(r2)} y2={y(r2)} />
        })}
      </svg>
      <svg className="sting-hero__spark sting-hero__spark--l" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" />
      </svg>
      <svg className="sting-hero__spark sting-hero__spark--r" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" />
      </svg>
      <p className={`sting-hero__big${size}`} key={big} aria-hidden="true">
        {big}
      </p>
      <p className={`sting-hero__cap${long ? ' is-long' : ''}`} aria-hidden="true">
        {cap}
      </p>
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
