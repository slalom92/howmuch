// 화면 움직임 두 가지 (라이브러리 없이)
//
// 1) useGrowOnView: 막대 그래프가 화면에 들어올 때 0에서 제 길이까지 자란다.
//    - 미리 그려 둔 HTML(SSR)에서는 막대가 처음부터 다 보인다. JS 가 돈 뒤에도,
//      그래프가 이미 화면 안(또는 위)에 있으면 건드리지 않는다. 화면 아래에 있을 때만
//      data-grow="wait" 로 접어 두었다가, 보이면 "go" 로 바꿔 자라게 한다.
//    - 모양은 src/styles.css 의 [data-grow] 규칙. 줄마다 style 로 --i(순서)를 주면 조금씩 늦게 자란다.
// 2) CountUp: 값이 바뀔 때(선수를 바꿀 때) 0부터 새 금액까지 빠르게 센다.
//    - 첫 화면에서는 세지 않고 금액을 바로 보여 준다(SSR 과 같은 글자).
//    - 화면 읽기 프로그램에는 세는 숫자 대신 최종 금액만 읽힌다.
// 움직임 줄이기(prefers-reduced-motion)를 켠 사용자에게는 둘 다 움직이지 않는다.
import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function useGrowOnView() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined' || reduced()) return
    // 이미 보이거나 지나간 그래프는 그대로 둔다 (보이는 막대가 접혔다 펴지지 않게)
    if (el.getBoundingClientRect().top < window.innerHeight) return
    el.dataset.grow = 'wait'
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        el.dataset.grow = 'go'
        io.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

const DURATION = 650
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export function CountUp({ value, format }) {
  const [shown, setShown] = useState(value)
  // 마지막으로 센 값. 값이 그대로면 세지 않는다 (첫 화면, 개발 모드에서 effect 가 두 번 돌 때)
  const last = useRef(value)
  useEffect(() => {
    if (last.current === value) return
    last.current = value
    if (reduced() || typeof requestAnimationFrame === 'undefined') {
      setShown(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION)
      setShown(t < 1 ? value * easeOut(t) : value)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
