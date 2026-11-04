import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { RPM } from '../lib/calc.js'
import { won } from '../lib/format.js'
import { planGoal, duration, bigCount, PACES, GOAL_SOURCES } from '../lib/goal.js'
import { track } from '../lib/analytics.js'
import GoalCurve from './GoalCurve.jsx'

const PRESETS = [
  [100, '100'],
  [1000, '1천'],
  [10000, '1만'],
  [100000, '10만'],
]

const parseSubs = (raw) => {
  const s = String(raw).replace(/[,\s명]/g, '')
  const m = s.match(/^(\d+(?:\.\d+)?)(만|천)?$/)
  if (!m) return null
  const n = Number(m[1]) * (m[2] === '만' ? 1e4 : m[2] === '천' ? 1e3 : 1)
  return Number.isFinite(n) ? Math.round(n) : null
}

// 숫자만 입력하면 세 자리마다 쉼표를 넣는다. '3.5만'처럼 단위를 쓰면 입력한 그대로 둔다.
function withCommas(value) {
  const digits = value.replace(/[,\s]/g, '')
  if (!/^\d*$/.test(digits)) return value
  return digits.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const pct = (p) => (p >= 10 ? `${Math.round(p)}%` : p >= 1 ? `${p.toFixed(1)}%` : p >= 0.01 ? `${p.toFixed(2)}%` : `${p.toPrecision(1)}%`)

export default function GoalPlan({ channel, analysis, tier }) {
  const id = useId()
  const [raw, setRaw] = useState('')
  const [pace, setPace] = useState(8)
  const mySubs = parseSubs(raw)
  const valid = mySubs != null && mySubs >= 1 && mySubs <= 1e9
  const tracked = useRef(false)
  const inputRef = useRef(null)
  const caret = useRef(null) // 쉼표가 들어가도 커서가 같은 숫자 뒤에 머물게 한다

  const onInput = (e) => {
    const el = e.target
    const next = withCommas(el.value)
    // 쉼표가 실제로 바뀔 때만 커서를 다시 잡는다 ('3.5만'처럼 단위를 쓰는 중이면 그대로 둔다)
    if (next !== el.value) {
      const before = el.value.slice(0, el.selectionStart ?? el.value.length)
      caret.current = before.replace(/[^\d]/g, '').length
    } else caret.current = null
    setRaw(next)
  }

  useLayoutEffect(() => {
    const el = inputRef.current
    if (caret.current == null || !el || document.activeElement !== el) return
    let pos = 0
    let seen = 0
    while (pos < raw.length && seen < caret.current) {
      if (/\d/.test(raw[pos])) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
    caret.current = null
  }, [raw])

  const plan = useMemo(
    () => (valid ? planGoal({ channel, analysis, tier, mySubs, uploadsPerMonth: pace }) : null),
    [valid, channel, analysis, tier, mySubs, pace],
  )

  useEffect(() => {
    if (!plan || tracked.current) return
    const t = setTimeout(() => {
      tracked.current = true
      track('goal_plan', { channel_id: channel.id, my_subs: mySubs, pace })
    }, 1500)
    return () => clearTimeout(t)
  }, [plan, channel.id, mySubs, pace])

  const paceLabel = PACES.find(([n]) => n === pace)?.[1]

  return (
    <section className="goal" aria-labelledby="goal-title">
      <h2 id="goal-title" className="hire__title">
        나도 {channel.title}만큼 벌려면?
      </h2>
      <p className="hire__lede">내 구독자 수를 넣으면 같은 수익을 내는 데 필요한 영상, 조회수, 시간을 계산해 봅니다.</p>

      <div className="goal__form">
        <div className="goal__field">
          <label htmlFor={id} className="goal__label">
            내 구독자 수
          </label>
          <div className="goal__input-wrap">
            <input
              id={id}
              className="goal__input"
              inputMode="numeric"
              autoComplete="off"
              ref={inputRef}
              placeholder="예: 1,200"
              value={raw}
              onChange={onInput}
              aria-describedby={`${id}-hint`}
            />
            <span className="goal__unit" aria-hidden="true">
              명
            </span>
          </div>
          <div className="goal__presets" id={`${id}-hint`}>
            {PRESETS.map(([n, label]) => (
              <button key={n} type="button" className={`goal__preset${mySubs === n ? ' is-on' : ''}`} onClick={() => setRaw(n.toLocaleString('ko-KR'))}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="goal__field">
          <span className="goal__label" id={`${id}-pace`}>
            업로드 속도
          </span>
          <div className="seg" role="radiogroup" aria-labelledby={`${id}-pace`}>
            {PACES.map(([n, label]) => (
              <button key={n} type="button" role="radio" aria-checked={pace === n} className={`seg__opt${pace === n ? ' is-on' : ''}`} onClick={() => setPace(n)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {raw && !valid && <p className="notice notice--error">구독자 수는 숫자로 넣어 주세요. 예: 1,200, 3.5만</p>}

      {plan && (
        <article className="order goal__card" aria-labelledby="goal-card-title">
          <header className="order__head">
            <p className="order__kind" id="goal-card-title">
              유튜버 도전 계획서
            </p>
            <p className="order__org">목표: {channel.title}</p>
          </header>

          <p className="goal__summary">
            {channel.title}의 한 달 수익 <strong>{won(plan.target)}</strong>을 벌려면, 구독자 {mySubs.toLocaleString('ko-KR')}명인 지금 채널로는
            {' '}
            <strong>매달 영상 {bigCount(Math.max(1, Math.ceil(plan.videosPerMonth)))}편</strong>이 필요해요.
          </p>

          <dl className="goal__stats">
            <div>
              <dt>필요한 영상</dt>
              <dd>매달 {bigCount(Math.max(1, Math.ceil(plan.videosPerMonth)))}편</dd>
              <p>내 영상 1편 예상 조회수 {bigCount(plan.myViews)}회 기준</p>
            </div>
            <div>
              <dt>제작 기간</dt>
              <dd>{plan.productionMonths <= 1 ? '한 달 안에 가능' : duration(plan.productionMonths)}</dd>
              <p>
                {paceLabel}(월 {pace}편)씩 만들 때, 한 달 치 수익에 필요한 영상을 다 만드는 데 걸리는 시간
              </p>
            </div>
            <div>
              <dt>필요한 조회수</dt>
              <dd>한 달 {bigCount(plan.needViews)}회</dd>
              <p>롱폼 1,000회당 {plan.rpm.toLocaleString('ko-KR')}원({RPM[tier].label}) 기준</p>
            </div>
            {plan.targetSubs > 0 && (
              <div>
                <dt>구독자 {bigCount(plan.targetSubs)}명까지</dt>
                <dd>{plan.ahead ? '이미 달성' : `평균 ${duration(plan.avgMonths)}`}</dd>
                <p>
                  {plan.ahead
                    ? `${channel.title}보다 구독자가 많아요`
                    : plan.paceMonths != null
                      ? `${channel.title} 속도라면 ${duration(plan.paceMonths)}`
                      : '구독자 수에 도달한 채널들의 평균 기간 기준'}
                </p>
              </div>
            )}
          </dl>

          {plan.targetSubs > 0 && (
            <GoalCurve
              mySubs={mySubs}
              targetSubs={plan.targetSubs}
              ageMonths={plan.ageMonths}
              channelTitle={channel.title}
              avgLabel={duration(plan.avgMonths)}
            />
          )}

          <ul className="order__facts">
            {plan.targetSubs > 0 && !plan.ahead && (
              <li>
                구독자가 {bigCount(plan.targetSubs)}명이 되면 매달 <strong>{bigCount(Math.max(1, Math.ceil(plan.videosAtTarget)))}편</strong>으로 충분해요
              </li>
            )}
            {plan.targetShare != null && (
              <li>
                구독자 {bigCount(plan.targetSubs)}명 이상 채널은 전체의 <strong>{pct(plan.targetShare)}</strong>
              </li>
            )}
            <li>
              지금 내 채널은 상위 <strong>{pct(plan.myShare)}</strong>
            </li>
          </ul>

          {!plan.monetized && (
            <p className="notice goal__notice">
              구독자 1,000명이 되어야 YouTube 파트너 프로그램에 가입해 광고 수익을 받을 수 있어요. 위 계산은 수익 창출 조건을 채웠다고 가정한 값이에요.
            </p>
          )}

          <p className="order__note">
            {plan.rawRate != null
              ? `내 영상 조회수는 ${channel.title}의 최근 롱폼 평균 조회수가 구독자의 ${Math.round(plan.rawRate * 100)}%인 점을 ${
                  Math.abs(plan.rawRate - plan.rate) > 0.001 ? `3~30% 범위로 맞춰(${Math.round(plan.rate * 100)}%) ` : ''
                }내 구독자에 적용한 추정이에요.`
              : `내 영상 조회수는 구독자의 ${Math.round(plan.rate * 100)}%로 가정했어요.`}{' '}
            모든 영상을 롱폼으로 만든다고 가정했어요.
            {plan.paceMonths != null && ` ${channel.title} 속도는 채널 개설일 기준이라 실제 활동 시작보다 길게 잡힐 수 있어요.`}
            {' '}출처: {GOAL_SOURCES.join('. ')}.
          </p>
        </article>
      )}
    </section>
  )
}
