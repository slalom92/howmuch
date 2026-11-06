import { useEffect, useRef, useState } from 'react'
import { track } from '../../lib/analytics.js'
import { PLAYERS, SEASON } from './kbo.js'

// 전광판 결과를 이미지(PNG)로 만들어 저장하거나 휴대폰 공유 창으로 보낸다.
// 모양(.imgshare*)은 유튜버 계산기의 이미지 공유와 같은 src/styles.css 를 쓴다.

function canShareFiles(file) {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
const ICON_SAVE = 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14'
const ICON_SHARE = 'M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12'
const ICON_IMAGE = 'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01'

// 파일 이름은 영문으로 (한글 파일 이름을 'download'로 바꿔 버리는 브라우저가 있다)
const fileName = (player) => `donmeter_kbo_${SEASON}_${PLAYERS.indexOf(player) + 1}.png`

export default function KboImageShare({ pr, caption }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState({ status: 'idle' })

  useEffect(() => () => state.url && URL.revokeObjectURL(state.url), [state.url])

  const make = async () => {
    const dlg = dialogRef.current
    setState({ status: 'making' })
    if (dlg && !dlg.open) dlg.showModal?.()
    try {
      const { drawScoreboard } = await import('./kboImage.js')
      const blob = await drawScoreboard(pr)
      const file = new File([blob], fileName(pr.player), { type: 'image/png' })
      setState({ status: 'ready', file, url: URL.createObjectURL(blob) })
      track('share_image', { method: 'create', content_type: 'kbo' })
    } catch {
      setState({ status: 'error' })
    }
  }

  const close = () => {
    dialogRef.current?.close()
    setState({ status: 'idle' })
  }

  const save = () => {
    const a = document.createElement('a')
    a.href = state.url
    a.download = state.file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    track('share_image', { method: 'download', content_type: 'kbo' })
  }

  const share = async () => {
    const link = window.location.href.split('#')[0]
    try {
      await navigator.share({ files: [state.file], title: caption, text: `${caption}\n${link}` })
      track('share_image', { method: 'native', content_type: 'kbo' })
    } catch {
      /* 이용자가 공유 창을 닫은 경우 */
    }
  }

  const ready = state.status === 'ready'
  const nativeOk = ready && canShareFiles(state.file)

  return (
    <>
      <button type="button" className="imgshare__solo kbo-imgbtn" onClick={make}>
        <Icon d={ICON_IMAGE} />
        전광판 이미지로 저장
      </button>

      <dialog ref={dialogRef} className="imgshare__dialog" aria-labelledby="kbo-img-title" onClose={() => setState({ status: 'idle' })} onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="imgshare__panel">
          <div className="imgshare__top">
            <h2 id="kbo-img-title" className="imgshare__heading">
              {pr.player.name} 연봉 전광판
            </h2>
            <button type="button" className="imgshare__close" onClick={close} aria-label="닫기">
              <Icon d="M6 6l12 12M18 6 6 18" />
            </button>
          </div>

          <div className="imgshare__preview">
            {state.status === 'making' && <p className="imgshare__wait">이미지를 만드는 중이에요…</p>}
            {state.status === 'error' && <p className="imgshare__wait">이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>}
            {ready && <img src={state.url} alt={`${caption} 이미지 미리보기`} />}
          </div>

          {ready && (
            <>
              <div className="imgshare__actions">
                {nativeOk && (
                  <button type="button" className="imgshare__primary" onClick={share}>
                    <Icon d={ICON_SHARE} />
                    공유하기
                  </button>
                )}
                <button type="button" className={nativeOk ? 'imgshare__secondary' : 'imgshare__primary'} onClick={save}>
                  <Icon d={ICON_SAVE} />
                  이미지 저장
                </button>
              </div>
              <p className="imgshare__hint">휴대폰에서는 이미지를 길게 눌러 사진에 저장할 수도 있어요.</p>
            </>
          )}
        </div>
      </dialog>
    </>
  )
}
