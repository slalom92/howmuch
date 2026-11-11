// 긁는 한 줄: 계산 결과를 내 노동시간·내 월급과 맞대어 한 줄로 찌르는 카드 (문장 도구는 src/lib/sting.js)
//
// - lines: [{ text: '**굵게** 섞인 문장', plain: '공유용 글자' }]. 첫 문장부터 보여 주고 "다른 걸로 긁기"로 넘긴다.
// - pay: 연봉 고르는 칸이 없는 계산기에서 넘기면 "연봉 ○○ 기준" 옆에 바꾸기 칸이 생긴다 ({ salary, onChange, basis }).
// - basis: 연봉 칸 대신 보여 줄 짧은 기준 글 (연봉을 이미 고르는 계산기)
import { useEffect, useRef, useState } from 'react'
import { track } from '../lib/analytics.js'
import { SALARIES } from '../lib/salary.js'

function Bold({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => (part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part))
}

// 발톱 자국 세 줄
function Claw() {
  return (
    <svg className="sting__claw" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M9 31C14 22 19 14 27 5M15 35c5-9 10-17 18-26M22 37c4-7 8-13 13-19" />
    </svg>
  )
}

export default function Sting({ page, lines, pay, basis }) {
  const [i, setI] = useState(0)
  const [msg, setMsg] = useState('')
  const [scratch, setScratch] = useState(false)
  const timer = useRef(null)
  const n = lines.length
  // 결과가 바뀌어 문장 수가 줄면 처음으로
  useEffect(() => {
    if (i >= n) setI(0)
  }, [i, n])
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!n) return null
  const line = lines[Math.min(i, n - 1)]

  const next = () => {
    setI((v) => (v + 1) % n)
    setMsg('')
    setScratch(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setScratch(false), 450)
    track('sting_next', { page })
  }

  const share = async () => {
    const url = window.location.href
    const text = `${line.plain} | 돈미터`
    track('sting_share', { page })
    try {
      if (navigator.share) {
        await navigator.share({ text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setMsg('문장과 링크를 복사했어요. 친구에게 붙여 넣어 보세요.')
    } catch (e) {
      if (e?.name !== 'AbortError') setMsg('공유하지 못했어요. 주소창의 링크를 복사해 보내 주세요.')
    }
  }

  return (
    <section className={`sting${scratch ? ' is-scratch' : ''}`} aria-label="긁는 한 줄">
      <Claw />
      <p className="sting__line" aria-live="polite">
        <Bold text={line.text} />
      </p>
      <div className="sting__foot">
        {pay ? (
          <label className="sting__pay">
            <span>내 연봉</span>
            <select
              value={pay.salary.id}
              onChange={(e) => {
                pay.onChange(e.target.value)
                track('sting_pay', { page, pay: e.target.value })
              }}
            >
              {SALARIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                  {s.note ? ` (${s.note})` : ''}
                </option>
              ))}
            </select>
            <span>{pay.basis === 'gross' ? '세전 기준' : '실수령 기준'}</span>
          </label>
        ) : (
          basis && <span className="sting__basis">{basis}</span>
        )}
        <span className="sting__acts">
          {n > 1 && (
            <button type="button" className="sting__btn" onClick={next}>
              다른 걸로 긁기 <small>{(Math.min(i, n - 1) + 1)}/{n}</small>
            </button>
          )}
          <button type="button" className="sting__btn sting__btn--share" onClick={share}>
            친구도 긁기
          </button>
        </span>
      </div>
      {msg && (
        <p className="sting__msg" role="status">
          {msg}
        </p>
      )}
    </section>
  )
}
