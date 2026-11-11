import { useCallback, useEffect, useMemo, useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import ChannelPicker from './components/ChannelPicker.jsx'
import PayStub from './components/PayStub.jsx'
import CompareChart from './components/CompareChart.jsx'
import AdSlot, { AdRails } from './components/AdSlot.jsx'
import CompanyCompare from './components/CompanyCompare.jsx'
import GoalPlan from './components/GoalPlan.jsx'
import ShareBar from './components/ShareBar.jsx'
import { BrandMark, PayEnvelope } from './components/Art.jsx'
import { searchChannels, loadChannel, DEMO_MODE } from './lib/youtube.js'
import { DEMO_CHANNELS } from './lib/demo.js'
import { analyze, monthlyRevenue, RPM, SHORTS_MAX_SEC } from './lib/calc.js'
import { loadCompany } from './lib/company.js'
import { placeInCompany } from './lib/career.js'
import { won } from './lib/format.js'
import { trackSearch, trackChannelView } from './lib/analytics.js'
import { channelPath, channelSlug, slugFromPath, isChannelId, revenueTitle } from './lib/popular.js'
import PopularChannels from './components/PopularChannels.jsx'
import HomeGuide from './components/HomeGuide.jsx'
import SiteMenu from './components/SiteMenu.jsx'
import FooterLinks from './components/FooterLinks.jsx'
import FloatingSwitch from './components/FloatingSwitch.jsx'
import { YOUTUBER } from './lib/menu.js'
import { FOOTER_NOTE } from './lib/disclaimer.js'
import SocialLinks from './components/Social.jsx'
import Sting from './components/Sting.jsx'
import { useMyPay } from './lib/sting.js'
import { youtuberStings, youtuberHero } from './lib/youtuberSting.js'
import StingHero from './components/StingHero.jsx'

const HOME_TITLE = '유튜브 수익 계산기 – 유튜버 한 달 수익 추정 | 돈미터'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  // PC 좌우 배너용 단위가 따로 없으면 상단 배너 단위를 같이 쓴다
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  // 모바일 본문 중간 광고: 따로 만든 단위가 없으면 상단 배너 단위를 쓴다
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

function setUrlParams(params) {
  const url = new URL(window.location.href)
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v)
    else url.searchParams.delete(k)
  }
  window.history.replaceState(null, '', url)
}

// 채널을 보면 주소를 /channel/<핸들>/ 로 바꾼다 (새로고침·주소 복사 시 검색에 잡히는 채널 페이지로 열림)
function setChannelUrl(ch) {
  const url = new URL(window.location.href)
  url.pathname = ch ? channelPath(ch) : YOUTUBER
  url.searchParams.delete('c')
  if (!ch) url.searchParams.delete('co')
  window.history.replaceState(null, '', url)
}

export default function App() {
  const [status, setStatus] = useState('idle') // idle | searching | picking | loading | done | error
  const [error, setError] = useState('')
  const [candidates, setCandidates] = useState([])
  const [channel, setChannel] = useState(null)
  const [period, setPeriod] = useState('month')
  const [tier, setTier] = useState('mid')
  const [company, setCompanyState] = useState(null)

  // 회사가 바뀌면 주소에도 남겨 공유·새로고침 때 그대로 보이게 한다 (상장사만)
  const setCompany = useCallback((co) => {
    setCompanyState(co)
    setUrlParams({ co: co && !co.manual ? co.code : null })
  }, [])

  const analysis = useMemo(() => (channel ? analyze(channel.videos) : null), [channel])
  const [myPay, setMyPay] = useMyPay()
  const busy = status === 'searching' || status === 'loading'

  const pick = useCallback(async (summary, source = 'search') => {
    setStatus('loading')
    setError('')
    try {
      const full = await loadChannel(summary)
      trackChannelView(full, source)
      setChannel(full)
      setChannelUrl(full)
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
      setCompany(null)
      setChannelUrl(null)
      try {
        const list = await searchChannels(q)
        trackSearch(q.trim().replace(/\s+/g, ' ').toLowerCase(), list.length)
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
    [pick, setCompany],
  )

  // 채널 페이지(/channel/<핸들>/)나 ?c=채널ID 로 들어오면 바로 계산
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = slugFromPath(window.location.pathname)
    const preset = window.__CHANNEL__ // 서버가 채널 페이지에 넣어 준 채널 ID
    const id = params.get('c') || (slug && (preset?.id || (isChannelId(slug) ? slug : null)))
    const co = params.get('co')
    if (id) pick(id, slug ? 'page' : 'link')
    else if (slug) {
      setStatus('loading')
      searchChannels('@' + slug)
        .then((list) => {
          if (list[0]) return pick(list[0], 'page')
          setError(`@${slug} 채널을 찾지 못했습니다. 채널 이름으로 다시 검색하세요.`)
          setStatus('error')
        })
        .catch((e) => {
          setError(e.message)
          setStatus('error')
        })
    }
    if ((id || slug) && /^\d{8}$/.test(co || '')) {
      loadCompany(co)
        .then(setCompanyState)
        .catch(() => setUrlParams({ co: null }))
    }
  }, [pick])

  // 탭 제목도 채널에 맞춘다
  useEffect(() => {
    if (status === 'done' && channel && analysis) {
      document.title = `${revenueTitle(channel.title)} – 한 달 약 ${won(monthlyRevenue(analysis, 'mid').total)} 추정 | 돈미터`
    } else if (status === 'searching' || status === 'picking') {
      document.title = HOME_TITLE
    }
  }, [status, channel, analysis])

  // 공유 링크와 문구 (공유 링크는 미리보기 문구를 만들어 주는 /s/ 페이지를 거친다)
  const share = useMemo(() => {
    if (!channel || !analysis) return null
    const monthly = monthlyRevenue(analysis, 'mid').total
    let text = `${channel.title} 한 달 추정 수익 ${won(monthly)}`
    if (company?.avgSalary) text += `, ${company.name} 기준 ${placeInCompany(company, monthly * 12).place.text}`
    const url = new URL('/s/', window.location.origin)
    url.searchParams.set('c', channel.id)
    if (company && !company.manual && company.code) url.searchParams.set('co', company.code)
    return { url: url.toString(), text: `${text} | 돈미터` }
  }, [channel, analysis, company])

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          {DEMO_MODE && <span className="demo-flag">데모 데이터로 보는 중</span>}
          <SiteMenu current={YOUTUBER} />
          {/* 색 테마 고르기: 메뉴와 동작은 public/theme.js 가 맡는다 */}
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="명세서 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      {/* PC: 본문 좌우 세로 배너 / 모바일: 이 자리 대신 본문 중간 광고(mid) */}
      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero">
          <div className="hero__text">
            <h1 className="hero__title">이 유튜버, 한 달에 얼마 벌까?</h1>
            <p className="hero__lede">채널 이름만 넣으면 한 달 광고 수익을 추정해 드려요.</p>
          </div>
          <PayEnvelope className="hero__art" />
          <SearchBar onSearch={search} busy={busy} examples={DEMO_MODE ? DEMO_CHANNELS.map((c) => c.title) : []} />
        </section>

        <div aria-live="polite">
          {status === 'error' && <p className="notice notice--error">{error}</p>}
          {busy && <p className="notice">YouTube에서 최근 영상을 불러오는 중입니다.</p>}
        </div>

        {status === 'picking' && <ChannelPicker channels={candidates} onPick={pick} />}

        {status === 'done' && channel && analysis && (
          <div id="result" className="result" tabIndex={-1}>
            <StingHero options={youtuberHero({ channel, analysis, tier, salary: myPay })} />
            <PayStub
              channel={channel}
              analysis={analysis}
              period={period}
              setPeriod={setPeriod}
              tier={tier}
              setTier={setTier}
            />
            <Sting key={channel.id} page="youtuber" lines={youtuberStings({ channel, analysis, tier, salary: myPay })} pay={{ salary: myPay, onChange: setMyPay, basis: 'net' }} />
            <CompareChart channel={channel} analysis={analysis} period={period} tier={tier} />
            <CompanyCompare channel={channel} analysis={analysis} tier={tier} company={company} setCompany={setCompany} />
            <GoalPlan key={channel.id} channel={channel} analysis={analysis} tier={tier} />
            {share && <ShareBar url={share.url} text={share.text} image={{ channel, analysis, period, tier, company }} />}
          </div>
        )}

        {status === 'done' && <AdSlot variant="inline" slot={SLOTS.inline} />}

        {!busy && <PopularChannels currentSlug={channel ? channelSlug(channel) : null} title={status === 'done' ? '다른 유튜버 수익도 보기' : '많이 찾는 유튜버'} limit={status === 'done' ? 14 : 8} />}

        <AdSlot variant="mid" slot={SLOTS.mid} />

        {status === 'done' ? (
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
              <p>
                <a href="/how/">계산 방법 자세히 보기</a> · <a href="/faq/">자주 묻는 질문</a>
              </p>
            </div>
          </details>
        ) : (
          !busy && status !== 'picking' && <HomeGuide />
        )}
      </main>

      <footer className="footer">
        <ul className="footer__links">
          <FooterLinks />
        </ul>
        <SocialLinks />
        <p>{FOOTER_NOTE}</p>
        <p>돈미터는 YouTube API 서비스를 사용하며, YouTube 또는 Google과 제휴하거나 승인받은 서비스가 아닙니다.</p>
      </footer>

      <FloatingSwitch current={YOUTUBER} />

      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
