// 주식 물타기 계산기 (/stock/): 내 평균 단가와 지금 가격으로 손익, 물타기 주식 수, 매도 순익을 셈한다
// 시세는 자동으로 가져오지 않는다 (stock.js 맨 위 설명). 입력은 이 브라우저 localStorage 에만 저장한다.
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FooterLinks from '../../components/FooterLinks.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import SocialLinks from '../../components/Social.jsx'
import { track } from '../../lib/analytics.js'
import Sting from '../../components/Sting.jsx'
import StingHero from '../../components/StingHero.jsx'
import { useMyPay, wonText } from '../../lib/sting.js'
import { STOCK } from '../../lib/menu.js'
import {
  POPULAR,
  MAX_ITEMS,
  MAX_LOTS,
  FEE,
  TAX,
  calculate,
  exampleItem,
  newItem,
  newLot,
  newId,
  cleanName,
  toQty,
  toPrice,
  loadStore,
  saveStore,
  fromShareSearch,
  toShareSearch,
  displayName,
  todayStr,
  won,
  signPct,
  pctPlain,
  qtyText,
  monthsText,
} from './stock.js'
import { stockStings, stockHero } from './sting.js'
import StockGuide from './StockGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

// 숫자 칸: 쉼표를 붙여 보여 주고, 숫자만 받는다
function NumInput({ id, value, onChange, unit, label, placeholder }) {
  return (
    <span className="sk-num">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        value={value ? value.toLocaleString('ko-KR') : ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {unit && <span className="sk-num__unit" aria-hidden="true">{unit}</span>}
    </span>
  )
}

// 저장한 종목 사이를 오가는 칩
function Holdings({ items, active, onPick, onAdd }) {
  const real = items.filter((it) => !it.example && !it.shared)
  if (!real.length) return null
  return (
    <nav className="sk-hold" aria-label="저장한 종목">
      <ul>
        {real.map((it) => (
          <li key={it.id}>
            <button type="button" className={`sk-hold__chip${it.id === active ? ' is-on' : ''}`} aria-pressed={it.id === active} onClick={() => onPick(it.id)}>
              {displayName(it.name)}
            </button>
          </li>
        ))}
        {real.length < MAX_ITEMS && (
          <li>
            <button type="button" className="sk-hold__chip is-add" onClick={onAdd}>
              + 종목 추가
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}

function Editor({ item, r, onChange, onRemove, canRemove }) {
  const today = todayStr()
  const setLot = (i, patch) => onChange({ ...item, lots: item.lots.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  return (
    <form className="apt-form sk-form" onSubmit={(e) => e.preventDefault()} aria-label="종목과 매수 내역">
      {item.example && <p className="sk-example">예시 숫자예요. 내 종목의 매수 내역과 지금 가격으로 바꿔 넣어 보세요.</p>}
      {item.shared && <p className="sk-example">공유받은 링크의 숫자예요. 바꾸면 내 종목으로 이 브라우저에 저장돼요.</p>}

      <div className="apt-q">
        <label className="apt-q__legend" htmlFor="sk-name">
          종목
        </label>
        <input
          id="sk-name"
          className="apt-select sk-name"
          type="text"
          list="sk-popular"
          maxLength={20}
          autoComplete="off"
          placeholder="예: 삼성전자 (목록에 없으면 직접 쓰세요)"
          value={item.name}
          onChange={(e) => onChange({ ...item, name: cleanName(e.target.value) })}
        />
        <datalist id="sk-popular">
          {POPULAR.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      <fieldset className="apt-q sk-lots">
        <legend className="apt-q__legend">매수 내역</legend>
        <div className="sk-lots__head" aria-hidden="true">
          <span>산 날</span>
          <span>주식 수</span>
          <span>1주 가격</span>
          <span />
        </div>
        <ol className="sk-lots__list">
          {item.lots.map((l, i) => (
            <li key={i} className="sk-lot">
              <input
                type="date"
                className="apt-select sk-date"
                aria-label={`${i + 1}번째 매수 날짜`}
                max={today}
                min="1990-01-01"
                value={l.d}
                onChange={(e) => setLot(i, { d: e.target.value })}
              />
              <NumInput label={`${i + 1}번째 매수 주식 수`} value={l.q} unit="주" placeholder="주식 수" onChange={(v) => setLot(i, { q: toQty(v) })} />
              <NumInput label={`${i + 1}번째 매수 1주 가격`} value={l.p} unit="원" placeholder="1주 가격" onChange={(v) => setLot(i, { p: toPrice(v) })} />
              <button
                type="button"
                className="sk-lot__del"
                aria-label={`${i + 1}번째 매수 지우기`}
                disabled={item.lots.length < 2}
                onClick={() => onChange({ ...item, lots: item.lots.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        {item.lots.length < MAX_LOTS && (
          <button type="button" className="sk-add" onClick={() => onChange({ ...item, lots: [...item.lots, { ...newLot(), d: today }] })}>
            + 매수 추가
          </button>
        )}
        <dl className="sk-sum">
          <div>
            <dt>총 매수 금액</dt>
            <dd>{r.invested ? won(r.invested) : '-'}</dd>
          </div>
          <div>
            <dt>평균 단가</dt>
            <dd>{r.qty ? won(Math.round(r.invested / r.qty)) : '-'}</dd>
          </div>
          <div>
            <dt>보유</dt>
            <dd>{r.qty ? qtyText(r.qty) : '-'}</dd>
          </div>
        </dl>
      </fieldset>

      <div className="apt-q">
        <label className="apt-q__legend" htmlFor="sk-cur">
          지금 가격 (1주)
        </label>
        <NumInput id="sk-cur" label="지금 가격" value={item.cur} unit="원" placeholder="증권 앱에 보이는 지금 가격" onChange={(v) => onChange({ ...item, cur: toPrice(v) })} />
        <p className="sk-hint">증권 앱에 보이는 지금 가격을 넣어 주세요. 돈미터는 시세를 따로 가져오지 않아요.</p>
      </div>

      {canRemove && (
        <p className="sk-remove">
          <button type="button" onClick={onRemove}>
            이 종목 지우기
          </button>
        </p>
      )}
    </form>
  )
}

// 지금 손익: 오르면 빨강, 내리면 파랑
function Verdict({ r }) {
  const tone = r.flat ? 'is-flat' : r.loss ? 'is-down' : 'is-up'
  return (
    <section className={`kbo-card sk-verdict ${tone}`} aria-labelledby="sk-verdict-title">
      <p className="sk-verdict__kicker" id="sk-verdict-title">
        {r.label}
        {r.days > 0 && ` · ${r.days.toLocaleString('ko-KR')}일째 보유`}
      </p>
      <p className="sk-verdict__main">
        <CountUp value={r.pl} format={(v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${wonText(Math.abs(v))}`} />
      </p>
      <p className="sk-verdict__rate">{signPct(r.rate, 2)}</p>
      <dl className="cr-verdict__grid">
        <div>
          <dt>평가 금액</dt>
          <dd>{wonText(r.value)}</dd>
        </div>
        <div>
          <dt>매수 금액</dt>
          <dd>{wonText(r.invested)}</dd>
        </div>
        <div>
          <dt>평균 단가 → 지금</dt>
          <dd>
            {won(Math.round(r.avg))} → {won(r.cur)}
          </dd>
        </div>
      </dl>
      {r.loss && !r.flat && (
        <p className="sk-note">
          본전(평균 단가)까지 주가가 <strong>{signPct(r.rebound)}</strong> 올라야 해요. 세금·수수료까지 메우려면 <strong>{won(Math.ceil(r.breakEven))}</strong>은 돼야 해요.
        </p>
      )}
    </section>
  )
}

// 물타기: 목표 수익률별로 지금 가격에 몇 주 더 사야 하는지
function Water({ r }) {
  const [t, setT] = useState(null)
  const list = r.water
  const cur = list.find((w) => w.t === t) || list[0]
  if (!list.length) {
    return (
      <section className="kbo-card sk-water" aria-labelledby="sk-water-title">
        <h2 className="kbo-card__title" id="sk-water-title">
          물타기
        </h2>
        <p className="sk-note">손실이 1%도 안 돼요. 물타기로 줄일 손실이 거의 없어요.</p>
      </section>
    )
  }
  return (
    <section className="kbo-card sk-water" aria-labelledby="sk-water-title">
      <h2 className="kbo-card__title" id="sk-water-title">
        물타기, 몇 주 더 사야 할까
      </h2>
      <fieldset className="apt-q sk-targets">
        <legend className="apt-q__legend">손실을 이만큼까지 줄이려면</legend>
        <div className="apt-q__opts">
          {list.map((w) => {
            const on = w.t === cur.t
            return (
              <label key={w.t} className={`apt-opt${on ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  className="sr-only"
                  name="sk-target"
                  checked={on}
                  onChange={() => {
                    setT(w.t)
                    track('stock_target', { t: w.t })
                  }}
                />
                {signPct(w.t, 0)}
              </label>
            )
          })}
        </div>
      </fieldset>
      <p className="sk-water__main">
        지금 가격으로 <strong>{qtyText(cur.shares)}</strong> 더 사면 {signPct(cur.newRate)}
      </p>
      <dl className="cr-verdict__grid">
        <div>
          <dt>더 넣을 돈</dt>
          <dd>{wonText(cur.costWithFee)}</dd>
        </div>
        <div>
          <dt>새 평균 단가</dt>
          <dd>{won(Math.round(cur.newAvg))}</dd>
        </div>
        <div>
          <dt>내 월급으로</dt>
          <dd>{monthsText(cur.costWithFee / r.monthly)} 치</dd>
        </div>
      </dl>
      <p className="sk-note">
        물타기 뒤 본전까지는 주가가 <strong>{signPct(cur.rebound)}</strong> 올라야 해요(지금은 {signPct(r.rebound)}). 지금 가격으로는 아무리 사도 평균 단가가 {won(r.cur)} 아래로 내려가지 않아서, 물타기로 본전(0%)을 만들 수는 없어요.
      </p>
      <div className="jb-table-wrap">
        <table className="jb-table sk-table">
          <caption className="sr-only">목표 수익률별 더 사야 하는 주식 수와 돈</caption>
          <thead>
            <tr>
              <th scope="col">목표</th>
              <th scope="col" className="num">
                더 살 주식
              </th>
              <th scope="col" className="num">
                필요한 돈
              </th>
              <th scope="col" className="num">
                새 평단
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.t} className={w.t === cur.t ? 'is-on' : ''}>
                <th scope="row">{signPct(w.t, 0)}</th>
                <td className="num">{qtyText(w.shares)}</td>
                <td className="num">{wonText(w.costWithFee)}</td>
                <td className="num">{won(Math.round(w.newAvg))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// 지금 팔면: 수수료·거래세 떼고 손에 남는 돈
function Sell({ r }) {
  return (
    <section className="kbo-card sk-sell" aria-labelledby="sk-sell-title">
      <h2 className="kbo-card__title" id="sk-sell-title">
        지금 다 팔면 손에 남는 돈
      </h2>
      <p className={`sk-sell__main${r.net < 0 ? ' is-down' : ' is-up'}`}>
        <strong>
          {r.net < 0 ? '−' : '+'}
          {wonText(Math.abs(r.net))}
        </strong>
      </p>
      <dl className="sk-bill">
        <div>
          <dt>평가 금액</dt>
          <dd>{won(Math.round(r.value))}</dd>
        </div>
        <div>
          <dt>매수 금액</dt>
          <dd>−{won(Math.round(r.invested))}</dd>
        </div>
        <div>
          <dt>증권거래세 ({pctPlain(TAX, 2)})</dt>
          <dd>−{won(Math.round(r.sellTax))}</dd>
        </div>
        <div>
          <dt>매매 수수료 (사고팔 때 {pctPlain(FEE, 3)} 어림)</dt>
          <dd>−{won(Math.round(r.sellFee + r.buyFee))}</dd>
        </div>
        <div className="is-total">
          <dt>순익</dt>
          <dd>
            {r.net < 0 ? '−' : '+'}
            {won(Math.round(Math.abs(r.net)))}
          </dd>
        </div>
      </dl>
      {r.net > 0 && (
        <p className="sk-note">
          내 월급 <strong>{Math.max(1, Math.round(r.plDays)).toLocaleString('ko-KR')}일</strong> 치를 주식이 벌었어요.
          {r.annual != null && (
            <>
              {' '}
              {r.days.toLocaleString('ko-KR')}일 들고 {signPct(r.rate)}, 1년으로 치면 {signPct(r.annual)}예요.
            </>
          )}
        </p>
      )}
      <p className="sk-note">대주주가 아니면 국내 상장주식 매매차익에는 양도세가 없어요. 배당과 해외 주식은 넣지 않았어요.</p>
    </section>
  )
}

const INITIAL = () => {
  const ex = exampleItem()
  return { items: [ex], active: ex.id }
}

export default function StockApp() {
  const [store, setStore] = useState(INITIAL)
  const [myPay, setMyPay] = useMyPay()
  const loaded = useRef(false)

  // 처음: 공유 링크 숫자 → 이 브라우저에 저장한 종목 → 예시 순서로 보여 준다
  useEffect(() => {
    const shared = fromShareSearch(window.location.search)
    const saved = loadStore()
    if (shared) {
      const items = [...(saved?.items || []), shared]
      setStore({ items, active: shared.id })
    } else if (saved) setStore(saved)
    loaded.current = true
  }, [])

  useEffect(() => {
    if (loaded.current) saveStore(store)
  }, [store])

  const item = store.items.find((it) => it.id === store.active) || store.items[0]
  const r = useMemo(() => calculate(item, myPay), [item, myPay])

  // 예시나 공유받은 숫자를 고치면 그때부터 내 종목으로 저장한다
  const update = (next) => {
    setStore((s) => {
      const promoted = next.example || next.shared ? { ...next, id: newId(), example: false, shared: false } : next
      const items = s.items.map((it) => (it.id === item.id ? promoted : it))
      return { items, active: promoted.id }
    })
  }
  const add = () => {
    const it = newItem()
    setStore((s) => ({ items: [...s.items.filter((x) => !x.example), it].slice(-MAX_ITEMS), active: it.id }))
    track('stock_add')
  }
  const remove = () => {
    setStore((s) => {
      const items = s.items.filter((it) => it.id !== item.id)
      if (!items.length) return INITIAL()
      return { items, active: items[items.length - 1].id }
    })
  }
  const pick = (id) => setStore((s) => ({ ...s, active: id }))

  // 주소창에는 공유용 숫자를 남기지 않는다 (입력은 저장소에만). 공유 버튼을 누를 때만 링크를 만든다.
  useEffect(() => {
    if (!loaded.current || !window.location.search) return
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState(null, '', url)
  }, [store.active])

  const share = useMemo(() => {
    if (typeof window === 'undefined' || !r.ready) return null
    const url = new URL(STOCK, window.location.origin)
    url.search = toShareSearch(r)
    const head = r.loss && !r.flat ? `${signPct(r.rate)}, 본전까지 ${signPct(r.rebound)}` : `${signPct(r.rate)}, 팔면 ${wonText(r.net)}`
    return { url: url.toString(), text: `${r.label} ${head} | 돈미터 주식 물타기 계산기` }
  }, [r])

  const resultRef = useRef(null)
  const [pastResult, setPastResult] = useState(false)
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setPastResult(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [r.ready])

  const real = store.items.filter((it) => !it.example && !it.shared)

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <SiteMenu current={STOCK} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <StingHero options={stockHero(r)} />
        <section className="hero sk-hero">
          <div className="hero__text">
            <h1 className="hero__title">주식 물타기 계산기</h1>
            <p className="hero__lede">매수 내역과 지금 가격을 넣으면 평균 단가와 손익, 손실을 줄이려면 몇 주 더 사야 하는지, 지금 팔면 세금·수수료 떼고 얼마가 남는지 보여 드려요.</p>
          </div>
        </section>

        <Holdings items={store.items} active={item.id} onPick={pick} onAdd={add} />
        <Editor item={item} r={r} onChange={update} onRemove={remove} canRemove={!item.example && (real.length > 1 || !!item.name || r.qty > 0)} />

        <div className="cr-result sk-result" id="sk-result" aria-live="polite">
          {r.ready ? (
            <>
              <div ref={resultRef}>
                <Verdict r={r} />
              </div>
              <Sting page="stock" lines={stockStings(r)} pay={{ salary: myPay, onChange: setMyPay, basis: 'net' }} />
              {r.loss && !r.flat ? <Water key={item.id} r={r} /> : <Sell r={r} />}
              {r.loss && !r.flat && <Sell r={r} />}
              <p className="sk-disclaim">투자 권유가 아니에요. 넣은 숫자로 셈만 해 보는 계산기예요.</p>
            </>
          ) : (
            <p className="apt-empty">매수 내역(주식 수, 1주 가격)과 지금 가격을 넣으면 손익을 계산해요.</p>
          )}
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크에는 평균 단가, 주식 수, 지금 가격만 담겨요. 직접 쓴 종목 이름과 매수 날짜는 담기지 않아요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <StockGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          <FooterLinks />
        </ul>
        <SocialLinks />
        <p>돈미터는 주식 시세를 가져오거나 보여 주지 않아요. 계산은 넣은 숫자로만 하고, 입력은 이 브라우저에만 저장돼요. 특정 종목이나 매매를 권하지 않아요.</p>
      </footer>

      <FloatingSwitch current={STOCK} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
