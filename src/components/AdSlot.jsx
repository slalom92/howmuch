import { useEffect, useRef } from 'react'

// 광고 영역.
// VITE_ADSENSE_CLIENT(ca-pub-…)가 설정되면 애드센스 광고 단위를 넣고,
// 없으면 크기를 확인할 수 있는 자리표시만 보여준다.
//
// 정책 메모: 광고 클릭을 유도하는 문구나, 버튼·입력창 바로 옆 배치는 애드센스 정책 위반이 될 수 있다.
// 라벨은 '광고'처럼 사실대로만 붙인다.

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || ''

export default function AdSlot({ slot, variant, label = '광고' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!CLIENT || !slot || !ref.current) return
    if (ref.current.dataset.loaded) return
    ref.current.dataset.loaded = '1'
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* 광고 차단기 등 */
    }
  }, [slot])

  return (
    <aside className={`ad ad--${variant}`} aria-label={label}>
      <span className="ad__label">{label}</span>
      {CLIENT && slot ? (
        <ins
          ref={ref}
          className="adsbygoogle ad__unit"
          style={{ display: 'block' }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format={variant === 'anchor' ? 'horizontal' : 'auto'}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad__placeholder">
          {variant === 'anchor' ? '하단 고정 광고 320×50 / 728×90' : variant === 'top' ? '상단 배너 728×90 / 320×50' : '본문 광고 반응형'}
        </div>
      )}
    </aside>
  )
}

export function loadAdSenseScript() {
  if (!CLIENT || document.querySelector('script[data-adsense]')) return
  const s = document.createElement('script')
  s.async = true
  s.dataset.adsense = '1'
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
  document.head.appendChild(s)
}
