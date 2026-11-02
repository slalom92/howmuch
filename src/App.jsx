import { useCallback, useEffect, useMemo, useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import ChannelPicker from './components/ChannelPicker.jsx'
import PayStub from './components/PayStub.jsx'
import CompareChart from './components/CompareChart.jsx'
import AdSlot from './components/AdSlot.jsx'
import { searchChannels, loadChannel, DEMO_MODE } from './lib/youtube.js'
import { DEMO_CHANNELS } from './lib/demo.js'
import { analyze, RPM, SHORTS_MAX_SEC } from './lib/calc.js'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

function setUrlChannel(id) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('c', id)
  else url.searchParams.delete('c')
  window.history.replaceState(null, '', url)
}

export default function App() {
  const [status, setStatus] = useState('idle') // idle | searching | picking | loading | done | error
  const [error, setError] = useState('')
  const [candidates, setCandidates] = useState([])
  const [channel, setChannel] = useState(null)
  const [period, setPeriod] = useState('month')
  const [tier, setTier] = useState('mid')

  const analysis = useMemo(() => (channel ? analyze(channel.videos) : null), [channel])
  const busy = status === 'searching' || status === 'loading'

  const pick = useCallback(async (summary) => {
    setStatus('loading')
    setError('')
    try {
      const full = await loadChannel(summary)
      setChannel(full)
      setUrlChannel(full.id)
      setStatus('done')
      requestAnimationFrame(() => document.getElementById('result')?.focus())
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }, [])

  const search = useCallback(
    async (q) => {
      setStatus('searching')
      setError('')
      setChannel(null)
      try {
        const list = await searchChannels(q)
        if (!list.length) {
          setError('검색 결과가 없습니다. 채널 이름을 바꾸거나 @핸들로 검색하세요.')
          setStatus('error')
        } else if (list.length === 1) {
          await pick(list[0])
        } else {
          setCandidates(list)
          setStatus('picking')
        }
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    },
    [pick],
  )

  // ?c=채널ID 로 들어오면 바로 계산 (공유 링크)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('c')
    if (id) pick(id)
  }, [pick])

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="./" onClick={() => setUrlChannel(null)}>
          유튜버 월급명세서
        </a>
        {DEMO_MODE && <span className="demo-flag">데모 데이터로 보는 중</span>}
      </header>

      <AdSlot variant="top" slot={SLOTS.top} />

      <main className="main">
        <section className="hero">
          <h1 className="hero__title">이 유튜버, 한 달에 얼마 벌까?</h1>
          <p className="hero__lede">
            구독자 수와 최근 영상 조회수로 광고 수익을 추정하고 직장인 월급과 나란히 놓아 봅니다.
          </p>
          <SearchBar onSearch={search} busy={busy} examples={DEMO_MODE ? DEMO_CHANNELS.map((c) => c.title) : []} />
        </section>

        <div aria-live="polite">
          {status === 'error' && <p className="notice notice--error">{error}</p>}
          {busy && <p className="notice">YouTube에서 최근 영상을 불러오는 중입니다.</p>}
        </div>

        {status === 'picking' && <ChannelPicker channels={candidates} onPick={pick} />}

        {status === 'done' && channel && analysis && (
          <div id="result" className="result" tabIndex={-1}>
            <PayStub
              channel={channel}
              analysis={analysis}
              period={period}
              setPeriod={setPeriod}
              tier={tier}
              setTier={setTier}
            />
            <CompareChart channel={channel} analysis={analysis} period={period} tier={tier} />
          </div>
        )}

        {status === 'done' && <AdSlot variant="inline" slot={SLOTS.inline} />}

        <details className="method">
          <summary>이 금액은 어떻게 계산되나요?</summary>
          <div className="method__body">
            <p>
              최근 업로드된 영상 최대 50개를 가져와 {SHORTS_MAX_SEC / 60}분 이하 영상은 쇼츠, 나머지는 롱폼으로 나눕니다.
              유형별로 평균 조회수(조회수 상·하위 10%는 제외)와 한 달 업로드 수를 구해 곱하면 한 달 동안 새로 생기는 조회수가
              됩니다. 여기에 1,000회당 크리에이터 수익(RPM)을 곱해 광고 수익을 추정합니다.
            </p>
            <table className="method__table">
              <caption>1,000회당 수익 가정</caption>
              <thead>
                <tr>
                  <th scope="col">가정</th>
                  <th scope="col" className="num">
                    롱폼
                  </th>
                  <th scope="col" className="num">
                    쇼츠
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(RPM).map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{v.label}</th>
                    <td className="num">{v.long.toLocaleString('ko-KR')}원</td>
                    <td className="num">{v.short.toLocaleString('ko-KR')}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              협찬, 멤버십, 슈퍼챗, 쇼핑 수익과 예전 영상에서 계속 나오는 조회수는 포함하지 않습니다. 실제 수익은 채널 주제와
              시청자 국가, 시즌에 따라 몇 배까지 차이 날 수 있으니 참고용으로만 보세요.
            </p>
          </div>
        </details>
      </main>

      <footer className="footer">
        <p>YouTube 공개 데이터(YouTube Data API)를 바탕으로 한 추정치이며, 실제 정산 금액과 다릅니다.</p>
        <p>이 사이트는 YouTube 또는 Google과 관련이 없습니다.</p>
      </footer>

      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
