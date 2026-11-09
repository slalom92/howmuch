import { useEffect, useRef, useState } from 'react'

// 광고 영역.
// VITE_ADSENSE_CLIENT(ca-pub-…)가 설정되면 애드센스 광고 단위를 넣고,
// 없으면 크기를 확인할 수 있는 자리표시만 보여준다.
//
// - 넓은 PC 화면(WIDE_QUERY): 본문 좌우에 세로 배너(rail, 160×600)를 고정해 둔다.
// - 그보다 좁은 화면(모바일·태블릿·작은 PC): 좌우 배너 대신 본문 중간 광고(mid, 300×250)를 넣는다.
// - 하단 고정 광고(anchor)와 결과 아래 광고(inline)는 화면 크기와 상관없이 그대로.
// - 고정 크기 위치는 고정 크기 광고 단위로 넣는다.
//   반응형(auto)으로 넣으면 모바일에서 300px 넘게 커져 본문을 가린다.
// - 광고가 채워지지 않으면(unfilled) 영역 전체를 숨긴다.
// - 하단 고정 광고의 실제 높이만큼 본문 아래 여백(--anchor-h)을 잡아 내용을 가리지 않게 한다.
//
// 정책 메모: 광고 클릭을 유도하는 문구나, 버튼·입력창 바로 옆 배치는 애드센스 정책 위반이 될 수 있다.

const RAW_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT || '').trim()
// 'ca-pub-' 없이 숫자만 넣어도 동작하도록 보정
const CLIENT = RAW_CLIENT ? `ca-pub-${RAW_CLIENT.replace(/^(ca-)?pub-/, '')}` : ''

const DESKTOP_QUERY = '(min-width: 760px)'
// 좌우 배너를 놓을 수 있는 화면: 본문(760) + 양쪽 배너(160+24)가 들어가고, 높이는 배너(약 620) + 하단 고정 광고(약 100)가 겹치지 않을 만큼.
// 1444px보다 좁으면 오른쪽 배너가 오른쪽 아래 바로가기 버튼(.float-switch)과 같은 세로줄에 놓이므로 높이를 더 요구한다.
// (styles.css 의 .ad--rail top 계산과 짝)
export const WIDE_QUERY = '(min-width: 1444px) and (min-height: 760px), (min-width: 1300px) and (min-height: 820px)'
const FIXED_SIZES = {
  top: { mobile: [320, 100], desktop: [728, 90] },
  mid: { mobile: [300, 250], desktop: [300, 250] },
  rail: { mobile: [160, 600], desktop: [160, 600] },
  anchor: { mobile: [320, 50], desktop: [728, 90] },
}
const PLACEHOLDER = { top: '상단 배너', mid: '본문 중간 광고', rail: '좌우 배너', anchor: '하단 고정 광고' }

function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const change = () => setOn(mq.matches)
    change()
    mq.addEventListener('change', change)
    return () => mq.removeEventListener('change', change)
  }, [query])
  return on
}

const useIsDesktop = () => useMedia(DESKTOP_QUERY)

// 서버에서 미리 그릴 때(홈 화면 HTML 미리 채우기)는 광고 자리를 만들지 않는다
export default function AdSlot(props) {
  if (typeof window === 'undefined') return null
  return <AdGate {...props} />
}

// 좌우 배너는 넓은 화면에서만, 본문 중간 광고는 그 밖의 화면에서만 요청한다 (안 보이는 광고는 아예 만들지 않음)
function AdGate(props) {
  const wide = useMedia(WIDE_QUERY)
  if (props.variant === 'rail' && !wide) return null
  if (props.variant === 'mid' && wide) return null
  return <AdSlotInner {...props} />
}

// PC 좌우 세로 배너 한 쌍. 페이지마다 한 번, 헤더 아래에 둔다.
export function AdRails({ slot }) {
  return (
    <>
      <AdSlot variant="rail" side="left" slot={slot} />
      <AdSlot variant="rail" side="right" slot={slot} />
    </>
  )
}

function AdSlotInner({ slot, variant, side, label = '광고' }) {
  const asideRef = useRef(null)
  const insRef = useRef(null)
  const [state, setState] = useState('pending') // pending | filled | unfilled
  const desktop = useIsDesktop()
  const live = Boolean(CLIENT && slot)

  const fixed = FIXED_SIZES[variant]
  const [w, h] = fixed ? fixed[desktop ? 'desktop' : 'mobile'] : [0, 0]
  // 화면 크기가 바뀌면 광고 단위를 새로 만든다 (고정 크기 단위는 한 번 그려지면 크기가 안 바뀜)
  const unitKey = fixed ? `${variant}-${side || ''}-${w}x${h}` : variant

  // 광고 요청 + 채움 여부 감시
  useEffect(() => {
    if (!live || !insRef.current) return
    const ins = insRef.current
    setState('pending')
    // 같은 ins에 두 번 push하면 애드센스 오류가 난다 (개발 모드 StrictMode 이중 실행 대비)
    if (!ins.dataset.pushed) {
      ins.dataset.pushed = '1'
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        /* 광고 차단기 등 */
      }
    }
    const read = () => {
      const s = ins.getAttribute('data-ad-status')
      if (s === 'filled' || s === 'unfilled') setState(s)
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })
    return () => mo.disconnect()
  }, [live, unitKey])

  const hidden = live && state === 'unfilled'

  // 하단 고정 광고: 실제 높이만큼 본문 아래 여백 확보
  useEffect(() => {
    if (variant !== 'anchor') return
    const root = document.documentElement
    const el = asideRef.current
    if (!el || hidden) {
      root.style.setProperty('--anchor-h', '0px')
      return
    }
    const apply = () => root.style.setProperty('--anchor-h', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty('--anchor-h', '0px')
    }
  }, [variant, hidden])

  if (hidden) return null

  return (
    <aside ref={asideRef} className={`ad ad--${variant}${side ? ` ad--${side}` : ''}`} data-state={live ? state : 'placeholder'} aria-label={label}>
      <span className="ad__label">{label}</span>
      {live ? (
        fixed ? (
          <ins
            key={unitKey}
            ref={insRef}
            className="adsbygoogle ad__unit"
            style={{ display: 'inline-block', width: w, height: h }}
            data-ad-client={CLIENT}
            data-ad-slot={slot}
          />
        ) : (
          <ins
            ref={insRef}
            className="adsbygoogle ad__unit"
            style={{ display: 'block' }}
            data-ad-client={CLIENT}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )
      ) : (
        <div className="ad__placeholder" style={fixed ? { width: w, height: h } : undefined}>
          {fixed ? `${PLACEHOLDER[variant]} ${w}×${h}` : '본문 광고 반응형'}
        </div>
      )}
    </aside>
  )
}

export function loadAdSenseScript() {
  // index.html에 직접 넣은 스크립트가 있으면 다시 넣지 않는다
  if (!CLIENT || document.querySelector('script[src*="adsbygoogle.js"]')) return
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
  document.head.appendChild(s)
}
