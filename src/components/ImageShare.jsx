import { useEffect, useRef, useState } from 'react'
import { track } from '../lib/analytics.js'
import { placeInCompany } from '../lib/career.js'
import { monthlyRevenue, PERIODS } from '../lib/calc.js'
import { won } from '../lib/format.js'

// 결과를 이미지(PNG)로 만들어 저장하거나 휴대폰 공유 창으로 보낸다.
// 그리는 코드(lib/shareImage.js)는 버튼을 누를 때 불러온다.

const PERIOD_WORD = { day: '하루', week: '한 주', month: '한 달', year: '1년' }

// 파일 이름은 영문으로 (한글 파일 이름을 'download'로 바꿔 버리는 브라우저가 있다)
function fileName(channel, kind) {
  const h = (channel.handle || '').replace(/^@/, '')
  const who = /^[\w.-]+$/.test(h) ? h : channel.id
  return `donmeter_${kind}_${who}.png`.slice(0, 80)
}

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

export default function ImageShare({ channel, analysis, period = 'month', tier = 'mid', company, place: placeProp, variant = 'bar' }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState({ status: 'idle' })

  // 사원증에 필요한 직급 (사원증 옆 버튼은 계산된 값을 받고, 공유 영역에서는 여기서 계산)
  const place =
    placeProp ||
    (company?.avgSalary && analysis ? placeInCompany(company, monthlyRevenue(analysis, tier).total * 12).place : null)

  // 미리보기 주소 정리
  useEffect(() => () => state.url && URL.revokeObjectURL(state.url), [state.url])

  const make = async (kind) => {
    const dlg = dialogRef.current
    setState({ status: 'making', kind })
    if (dlg && !dlg.open) dlg.showModal?.()
    try {
      const { drawPayslip, drawBadge } = await import('../lib/shareImage.js')
      const blob = kind === 'badge' ? await drawBadge({ channel, company, place }) : await drawPayslip({ channel, analysis, period, tier })
      const file = new File([blob], fileName(channel, kind), { type: 'image/png' })
      const caption =
        kind === 'badge'
          ? `${channel.title}, ${company.stockName || company.name} 다니면 무슨 직급일까?`
          : `${channel.title} ${PERIOD_WORD[period]} 추정 수익 ${won(monthlyRevenue(analysis, tier).total * PERIODS[period].factor)}`
      setState({ status: 'ready', kind, file, url: URL.createObjectURL(blob), caption })
      track('share_image', { method: 'create', content_type: kind })
    } catch {
      setState({ status: 'error', kind })
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
    track('share_image', { method: 'download', content_type: state.kind })
  }

  const share = async () => {
    const link = window.location.href.split('#')[0]
    try {
      await navigator.share({ files: [state.file], title: state.caption, text: `${state.caption}\n${link}` })
      track('share_image', { method: 'native', content_type: state.kind })
    } catch {
      /* 이용자가 공유 창을 닫은 경우 */
    }
  }

  const ready = state.status === 'ready'
  const nativeOk = ready && canShareFiles(state.file)

  return (
    <>
      {variant === 'badge' ? (
        <button type="button" className="imgshare__solo" onClick={() => make('badge')}>
          <Icon d={ICON_IMAGE} />
          사원증 이미지로 저장
        </button>
      ) : (
        <div className="imgshare">
          <p className="imgshare__title">이미지로 저장해서 올리기</p>
          <p className="imgshare__sub">인스타그램 스토리나 단톡방에 바로 올릴 수 있는 그림으로 만들어 드려요.</p>
          <div className="imgshare__btns">
            <button type="button" className="imgshare__btn" onClick={() => make('payslip')}>
              <Icon d={ICON_IMAGE} />
              급여명세서 이미지
            </button>
            {place && (
              <button type="button" className="imgshare__btn" onClick={() => make('badge')}>
                <Icon d={ICON_IMAGE} />
                가상 사원증 이미지
              </button>
            )}
          </div>
        </div>
      )}

      <dialog ref={dialogRef} className="imgshare__dialog" aria-labelledby={`imgshare-${variant}-title`} onClose={() => setState({ status: 'idle' })} onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="imgshare__panel">
          <div className="imgshare__top">
            <h2 id={`imgshare-${variant}-title`} className="imgshare__heading">
              {state.kind === 'badge' ? '가상 사원증 이미지' : '급여명세서 이미지'}
            </h2>
            <button type="button" className="imgshare__close" onClick={close} aria-label="닫기">
              <Icon d="M6 6l12 12M18 6 6 18" />
            </button>
          </div>

          <div className="imgshare__preview">
            {state.status === 'making' && <p className="imgshare__wait">이미지를 만드는 중이에요…</p>}
            {state.status === 'error' && <p className="imgshare__wait">이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>}
            {ready && <img src={state.url} alt={`${state.caption} 이미지 미리보기`} />}
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
              <p className="imgshare__hint">휴대폰에서는 이미지를 길게 눌러 사진에 저장할 수도 있어요. 프로필 사진은 YouTube 채널 이미지예요.</p>
            </>
          )}
        </div>
      </dialog>
    </>
  )
}
