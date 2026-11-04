import { useEffect, useState } from 'react'
import { track } from '../lib/analytics.js'
import { Scissors } from './Art.jsx'
import ImageShare from './ImageShare.jsx'

// 카카오톡 공유는 카카오 JavaScript 키(VITE_KAKAO_JS_KEY)와 카카오 디벨로퍼스의 사이트 도메인 등록이 필요하다.
// 키가 없으면 휴대폰 기본 공유 창(지원되는 기기) 또는 링크 복사로 대신한다.
const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY || ''
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js'
const KAKAO_SRI = 'sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E'

function useKakao() {
  const [ready, setReady] = useState(() => Boolean(window.Kakao?.isInitialized?.()))
  useEffect(() => {
    if (!KAKAO_KEY || ready) return
    const init = () => {
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY)
        setReady(true)
      } catch {
        /* 무시 */
      }
    }
    if (window.Kakao) return init()
    const s = document.createElement('script')
    s.src = KAKAO_SDK
    s.integrity = KAKAO_SRI
    s.crossOrigin = 'anonymous'
    s.onload = init
    document.head.appendChild(s)
  }, [ready])
  return ready
}

// 서비스 로고 대신 일반 기호와 글자를 쓴다. 공식 로고를 쓰려면 각 서비스의 브랜드 가이드에 따른 이미지로 바꾸면 된다.
const Glyph = {
  kakao: <path d="M12 4.5c-4.7 0-8.5 2.9-8.5 6.6 0 2.3 1.5 4.4 3.9 5.6l-.8 3.1 3.4-2.3c.6.1 1.3.2 2 .2 4.7 0 8.5-3 8.5-6.6S16.7 4.5 12 4.5z" />,
  x: 'X',
  facebook: 'f',
  threads: '@',
  band: 'B',
  link: (
    <path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8 18a4 4 0 0 1-2.8-6.8l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1A2 2 0 0 0 9.4 15.4l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1A4 4 0 0 1 8 18zm8.7-3.7a1 1 0 0 1-.7-1.7l2.1-2.1A2 2 0 0 0 15.3 7.7l-2.1 2.1a1 1 0 1 1-1.4-1.4l2.1-2.1a4 4 0 0 1 5.6 5.6l-2.1 2.1a1 1 0 0 1-.7.3z" />
  ),
  more: <path d="M6 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />,
}

function ShareIcon({ name }) {
  const g = Glyph[name]
  if (typeof g === 'string') {
    return (
      <span className="share__glyph" aria-hidden="true">
        {g}
      </span>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {g}
    </svg>
  )
}

export default function ShareBar({ url, text, image }) {
  const kakaoReady = useKakao()
  const [toast, setToast] = useState('')
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  const copy = async (msg = '링크를 복사했습니다.') => {
    try {
      await navigator.clipboard.writeText(url)
      flash(msg)
    } catch {
      window.prompt('아래 링크를 복사하세요.', url)
    }
  }

  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=640')

  const share = async (method) => {
    track('share', { method, content_type: 'result' })
    const u = encodeURIComponent(url)
    const t = encodeURIComponent(text)
    switch (method) {
      case 'kakao':
        if (kakaoReady) return window.Kakao.Share.sendScrap({ requestUrl: url })
        if (canNative) return navigator.share({ title: text, url }).catch(() => {})
        return copy('링크를 복사했습니다. 카카오톡 대화방에 붙여 넣으세요.')
      case 'x':
        return open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`)
      case 'facebook':
        return open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
      case 'threads':
        return open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`)
      case 'band':
        return open(`https://band.us/plugin/share?body=${encodeURIComponent(`${text}\n${url}`)}&route=${encodeURIComponent(location.host)}`)
      case 'native':
        return navigator.share({ title: text, url }).catch(() => {})
      default:
        return copy()
    }
  }

  const buttons = [
    ['kakao', '카카오톡'],
    ['x', 'X(트위터)'],
    ['facebook', '페이스북'],
    ['threads', '스레드'],
    ['band', '밴드'],
    ['link', '링크 복사'],
    ...(canNative ? [['native', '더보기']] : []),
  ]

  return (
    <div className="share">
      <Scissors />
      <p className="share__title">결과를 잘라서 보내기</p>
      <p className="share__sub">링크를 받은 사람도 같은 결과를 보고, 자기 회사로 바꿔 계산해 볼 수 있어요.</p>
      <ul className="share__list">
        {buttons.map(([k, label]) => (
          <li key={k}>
            <button type="button" className={`share__btn share__btn--${k === 'native' ? 'more' : k}`} onClick={() => share(k)} aria-label={`${label}로 공유`}>
              <ShareIcon name={k === 'native' ? 'more' : k} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="share__toast" role="status" aria-live="polite">
        {toast}
      </p>
      {image && <ImageShare {...image} />}
    </div>
  )
}
