import { useEffect, useRef, useState } from 'react'

// 광고 영역.
// VITE_ADSENSE_CLIENT(ca-pub-…)가 설정되면 애드센스 광고 단위를 넣고,
// 없으면 크기를 확인할 수 있는 자리표시만 보여준다.
//
// - 상단 배너와 하단 고정 광고는 고정 크기 광고 단위로 넣는다.
//   반응형(auto)으로 넣으면 모바일에서 300px 넘게 커져 본문을 가린다.
// - 광고가 채워지지 않으면(unfilled) 영역 전체를 숨긴다.
// - 하단 고정 광고의 실제 높이만큼 본문 아래 여백(--anchor-h)을 잡아 내용을 가리지 않게 한다.
//
// 정책 메모: 광고 클릭을 유도하는 문구나, 버튼·입력창 바로 옆 배치는 애드센스 정책 위반이 될 수 있다.

const RAW_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT || '').trim()
// 'ca-pub-' 없이 숫자만 넣어도 동작하도록 보정
const CLIENT = RAW_CLIENT ? `ca-pub-${RAW_CLIENT.replace(/^(ca-)?pub-/, '')}` : ''

const DESKTOP_QUERY = '(min-width: 760px)'
const FIXED_SIZES = {
  top: { mobile: [320, 100], desktop: [728, 90] },
  anchor: { mobile: [320, 50], desktop: [728, 90] },
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

// 서버에서 미리 그릴 때(홈 화면 HTML 미리 채우기)는 광고 자리를 만들지 않는다
export default function AdSlot(props) {
  if (typeof window === 'undefined') return null
  return <AdSlotInner {...props} />
}

function AdSlotInner({ slot, variant, label = '광고' }) {
  const asideRef = useRef(null)
  const insRef = useRef(null)
  const [state, setState] = useState('pending') // pending | filled | unfilled
  const desktop = useIsDesktop()
  const live = Boolean(CLIENT && slot)

  const fixed = FIXED_SIZES[variant]
  const [w, h] = fixed ? fixed[desktop ? 'desktop' : 'mobile'] : [0, 0]
  // 화면 크기가 바뀌면 광고 단위를 새로 만든다 (고정 크기 단위는 한 번 그려지면 크기가 안 바뀜)
  const unitKey = fixed ? `${variant}-${w}x${h}` : variant

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
    <aside ref={asideRef} className={`ad ad--${variant}`} data-state={live ? state : 'placeholder'} aria-label={label}>
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
          {fixed ? `${variant === 'anchor' ? '하단 고정 광고' : '상단 배너'} ${w}×${h}` : '본문 광고 반응형'}
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
