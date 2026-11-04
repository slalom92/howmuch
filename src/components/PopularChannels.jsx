import { useEffect, useState } from 'react'
import { channelPath, mergeChannels } from '../lib/popular.js'
import { DEMO_MODE } from '../lib/youtube.js'

// 다른 유튜버 바로가기. 링크마다 채널 페이지(/channel/<핸들>/)가 열려 검색엔진도 따라갈 수 있다.
// 목록은 YouTube 한국 인기 동영상의 채널로 6시간마다 자동 갱신되고(/api/trending/),
// 불러오기 전이나 실패하면 고정 목록을 보여 준다.
const KEY = 'yt:trending'
const SLOT = 6 * 3600 * 1000

// 브라우저 저장본은 "목록이 만들어진 시각"부터 6시간까지만 쓴다 (받은 시각 기준이면 최대 12시간 묵을 수 있다)
function cached() {
  try {
    const { v } = JSON.parse(localStorage.getItem(KEY) || 'null') || {}
    const made = Date.parse(v?.updatedAt || '')
    return made && Date.now() - made < SLOT ? v : null
  } catch {
    return null
  }
}

// 인기 차트 위쪽은 하루 넘게 그대로인 경우가 많아서, 받은 목록(최대 20개)을 6시간마다 다른 자리부터 보여 준다
function rotate(items, limit) {
  if (!items?.length || items.length <= limit) return items
  const slot = Math.floor(Date.now() / SLOT)
  const start = (slot * limit) % items.length
  return [...items.slice(start), ...items.slice(0, start)]
}

const hourText = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', timeZone: 'Asia/Seoul' })
}

export default function PopularChannels({ currentSlug, title, limit = 14 }) {
  const [trend, setTrend] = useState(cached)

  useEffect(() => {
    if (trend || DEMO_MODE) return
    let alive = true
    fetch('/api/trending/')
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive || !body?.items) return
        const v = { source: body.source, items: body.items, updatedAt: body.updatedAt }
        setTrend(v)
        if (body.source === 'trending' && Date.now() - Date.parse(body.updatedAt || '') < SLOT) {
          try {
            localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v }))
          } catch {
            /* 무시 */
          }
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [trend])

  const live = trend?.source === 'trending'
  const list = mergeChannels(live ? rotate(trend.items, limit) : null, currentSlug, limit)

  return (
    <nav className="popular" aria-labelledby="popular-title">
      <h2 className="popular__title" id="popular-title">
        {title}
      </h2>
      <ul className="popular__list">
        {list.map((p) => (
          <li key={p.slug}>
            <a className="popular__chip" href={channelPath(p.slug)}>
              {p.name}
            </a>
          </li>
        ))}
      </ul>
      <p className="popular__meta">
        {live && <span>YouTube 한국 인기 동영상 기준{trend.updatedAt ? ` (${hourText(trend.updatedAt)} 업데이트)` : ''}, 6시간마다 바뀌어요. </span>}
        <a className="popular__all" href="/channel/">
          유튜버별 수익 전체 보기
        </a>
      </p>
    </nav>
  )
}
