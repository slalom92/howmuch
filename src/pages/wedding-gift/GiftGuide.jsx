import { won } from '../../lib/format.js'
import { RELATIONS } from './gift.js'

// 계산기 아래 안내 글 (검색·광고 심사용 본문이기도 하다)
// 질문과 답은 wedding-gift/index.html 의 FAQ 구조화 데이터와 같게 유지한다.
export const FAQ = [
  {
    q: '축의금을 계좌이체로 보내도 괜찮을까요?',
    a: '모바일 청첩장에 계좌가 적혀 있다면 이체도 흔한 방법이에요. 이름만 찍히면 누군지 모를 수 있으니 받는 분 표시에 이름과 관계를 함께 남기고, 축하 메시지도 따로 보내면 좋아요.',
  },
  {
    q: '부부나 가족이 함께 가면 얼마를 내야 하나요?',
    a: '먹는 사람 수만큼 식대가 들어요. 서울 웨딩홀이라면 둘이 갈 때 15만~20만 원은 돼야 식대가 채워지는 경우가 많아요. 계산기에서 인원을 바꾸면 바로 반영돼요.',
  },
  {
    q: '내 결혼식 때 받은 금액보다 적게 내도 될까요?',
    a: '받은 만큼 돌려주는 것이 기본이에요. 몇 년이 지났다면 그사이 오른 식대를 생각해 한 단계 올려 내는 사람도 많아요.',
  },
  {
    q: '이 계산기 금액이 정답인가요?',
    a: '아니요. 공개된 설문과 식대 통계로 만든 참고선이에요. 서로의 형편과 관계, 지역 관습에 따라 달라질 수 있어요.',
  },
]

const SOURCES = [
  { href: 'https://www.thestar.com.my/aseanplus/aseanplus-news/2026/05/14/at-korean-weddings-the-traditional-50000-won-envelope-is-losing-ground', label: 'NH농협은행 축의금 이체 분석, 인크루트 직장인 설문', by: 'Korea Herald · 2026년 5월' },
  { href: 'https://www.inews24.com/view/1710001', label: '신한은행 보통사람 금융생활 보고서', by: '아이뉴스24' },
  { href: 'https://economist.co.kr/article/view/ecn202608280005', label: '가연 결혼 비용 및 축의금 인식 조사', by: '이코노미스트 · 2026년 8월' },
  { href: 'https://www.ytn.co.kr/_ln/0103_202610132323067450', label: '한국소비자원 참가격 예식장 식대', by: 'YTN · 2026년 10월' },
  { href: 'https://www.price.go.kr/', label: '한국소비자원 참가격', by: 'price.go.kr' },
]

// 표에 넣을 범위: "10~15만 원"처럼 짧게 (좁은 화면에서도 한 줄에 들어가게)
const range = (a, b) => {
  if (a === b) return won(a)
  if (a >= 1e4 && b < 1e8) return `${a / 1e4}~${b / 1e4}만 원`
  return `${won(a)} ~ ${won(b)}`
}

// ---------- 그림 부품 (색은 테마 변수를 따른다) ----------

const ICONS = {
  table: (
    <>
      <rect x="9" y="10" width="30" height="28" rx="3" />
      <path d="M9 18h30M20 18v20" />
      <path d="M25 25h9M25 31h6" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
  trend: (
    <>
      <path d="M8 38h32" />
      <path d="M12 32l8-7 6 4 10-12" style={{ stroke: 'var(--seal)' }} />
      <path d="M31 17h5v5" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
  split: (
    <>
      <rect x="7" y="14" width="15" height="20" rx="2" />
      <rect x="26" y="14" width="15" height="20" rx="2" />
      <path d="M11 20h7M30 20h7" />
      <path d="M11 27h4" style={{ stroke: 'var(--seal)' }} />
      <path d="M30 27h7" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
  meal: (
    <>
      <circle cx="24" cy="26" r="11" />
      <circle cx="24" cy="26" r="6" style={{ stroke: 'var(--seal)' }} />
      <path d="M8 12v8a3 3 0 0 0 3 3v15M11 12v8M14 12v8M38 12c-3 2-3 9 0 11v15" />
    </>
  ),
  people: (
    <>
      <circle cx="17" cy="17" r="5" />
      <circle cx="32" cy="19" r="4" style={{ stroke: 'var(--seal)' }} />
      <path d="M8 36c1-6 4.5-9 9-9s8 3 9 9M27 36c.6-5 2.5-7.5 5-7.5s4.6 2.5 5.4 7.5" />
    </>
  ),
  envelope: (
    <>
      <rect x="7" y="13" width="34" height="23" rx="2" />
      <path d="M7 15l17 11 17-11" />
      <circle cx="24" cy="26" r="3" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
  faq: (
    <>
      <path d="M9 11h30v19H22l-8 7v-7H9z" />
      <path d="M20 18a4 4 0 1 1 5 3.9V24M24.5 27.5v.5" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
  link: (
    <>
      <path d="M21 27a6 6 0 0 0 8.5 0l5-5a6 6 0 0 0-8.5-8.5l-2 2" />
      <path d="M27 21a6 6 0 0 0-8.5 0l-5 5a6 6 0 0 0 8.5 8.5l2-2" style={{ stroke: 'var(--seal)' }} />
    </>
  ),
}

function Section({ no, icon, title, children, className = '' }) {
  return (
    <section className={`gift-card ${className}`}>
      <header className="gift-card__head">
        <svg className="gift-card__icon" viewBox="0 0 48 48" aria-hidden="true" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ink)' }}>
          {ICONS[icon]}
        </svg>
        <div>
          {no && <p className="gift-card__no">{no}</p>}
          <h2 className="gift-sec__title">{title}</h2>
        </div>
      </header>
      {children}
    </section>
  )
}

// 가로 막대: 값 하나를 가진 막대 여러 개 (모두 한 가지 색, 강조 막대만 도장색)
function Bars({ rows, max, unit = '', mark, caption }) {
  return (
    <figure className="gift-bars">
      {caption && <figcaption className="gift-bars__cap">{caption}</figcaption>}
      <ul className="gift-bars__list">
        {rows.map((r) => (
          <li key={r.label} className={`gift-bars__row${r.hi ? ' is-hi' : ''}`} title={`${r.label}: ${r.text}`}>
            <span className="gift-bars__label">{r.label}</span>
            <span className="gift-bars__track">
              <span className="gift-bars__fill" style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }} />
              {mark && <span className="gift-bars__mark" style={{ left: `${(mark.value / max) * 100}%` }} aria-hidden="true" />}
            </span>
            <span className="gift-bars__value">
              {r.text}
              {unit}
            </span>
          </li>
        ))}
      </ul>
      {mark && <p className="gift-bars__legend"><span className="gift-bars__legend-mark" aria-hidden="true" />{mark.label}</p>}
    </figure>
  )
}

function Stat({ value, label, note }) {
  return (
    <div className="gift-stat">
      <p className="gift-stat__label">{label}</p>
      <p className="gift-stat__value">{value}</p>
      {note && <p className="gift-stat__note">{note}</p>}
    </div>
  )
}

// 봉투 앞·뒤 쓰는 위치
function EnvelopeHowTo() {
  const line = { stroke: 'var(--ink)' }
  const seal = { fill: 'var(--seal)' }
  const muted = { fill: 'var(--muted)' }
  return (
    <div className="gift-howto" role="img" aria-label="봉투 앞면 가운데에 祝結婚, 뒷면 왼쪽 아래에 이름을 세로로 씁니다">
      <figure>
        <svg viewBox="0 0 160 220" aria-hidden="true">
          <rect x="6" y="6" width="148" height="208" rx="4" fill="var(--paper)" strokeWidth="2.5" style={line} />
          <text x="80" y="64" textAnchor="middle" fontSize="30" fontWeight="700" style={seal}>祝</text>
          <text x="80" y="110" textAnchor="middle" fontSize="30" fontWeight="700" style={seal}>結</text>
          <text x="80" y="156" textAnchor="middle" fontSize="30" fontWeight="700" style={seal}>婚</text>
        </svg>
        <figcaption>앞면 · 가운데</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 160 220" aria-hidden="true">
          <rect x="6" y="6" width="148" height="208" rx="4" fill="var(--paper)" strokeWidth="2.5" style={line} />
          <path d="M6 10l74 56 74-56" fill="none" strokeWidth="2" style={line} />
          <rect x="22" y="120" width="34" height="80" rx="3" fill="none" strokeDasharray="4 4" strokeWidth="2" style={{ stroke: 'var(--seal)' }} />
          <text x="39" y="148" textAnchor="middle" fontSize="15" fontWeight="600" style={muted}>홍</text>
          <text x="39" y="168" textAnchor="middle" fontSize="15" fontWeight="600" style={muted}>길</text>
          <text x="39" y="188" textAnchor="middle" fontSize="15" fontWeight="600" style={muted}>동</text>
        </svg>
        <figcaption>뒷면 · 왼쪽 아래</figcaption>
      </figure>
    </div>
  )
}

export default function GiftGuide() {
  return (
    <article className="gift-guide">
      <Section no="01" icon="table" title="관계별 축의금 기준표 (2026년)">
        <p>혼자 참석하고 서울 웨딩홀 식대(1인 약 8만 원)일 때를 기준으로 정리했어요. 둘 이상 가거나 호텔 예식이면 식대만큼 더 올라가요.</p>
        <div className="gift-table-wrap">
          <table className="gift-table">
            <thead>
              <tr>
                <th scope="col">관계</th>
                <th scope="col" className="num">
                  <span className="gift-tag gift-tag--go">직접 참석</span>
                </th>
                <th scope="col" className="num">
                  <span className="gift-tag">봉투만</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {RELATIONS.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td className="num">{range(Math.max(r.attend, 100000), Math.max(r.attendMore, 100000))}</td>
                  <td className="num">{range(r.absent, r.absentMore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section no="02" icon="trend" title="요즘 축의금, 5만 원은 적을까?">
        <div className="gift-split">
          <Stat label="2025년 축의금 이체 평균" value="11만 7천 원" note="NH농협은행 이체 분석" />
          <Bars
            caption="연도별 평균"
            max={120000}
            rows={[
              { label: '2023년', value: 110000, text: '11만 원' },
              { label: '2024년', value: 114000, text: '11만 4천 원' },
              { label: '2025년', value: 117000, text: '11만 7천 원', hi: true },
            ]}
          />
        </div>
        <ul className="gift-chips">
          <li>
            5만 원 비중 <strong>46.5% → 42.3%</strong> <span className="gift-chips__down">줄었어요</span>
          </li>
          <li>
            10만 원 비중 <strong>36.1% → 39.7%</strong> <span className="gift-chips__up">늘었어요</span>
          </li>
        </ul>
        <p>
          NH농협은행이 고객들의 축의금 이체를 분석해 보니 2025년 평균은 11만 7천 원이었어요. 2023년 11만 원에서 꾸준히 올랐고, 5만 원을 보내는
          비중은 줄어든 반면 10만 원을 보내는 비중은 늘었어요. 직접 참석한다면 10만 원이 사실상 기본값이 된 셈이에요.
        </p>
      </Section>

      <Section no="03" icon="split" title="참석할 때와 봉투만 보낼 때">
        <div className="gift-versus">
          <div className="gift-versus__item is-go">
            <p className="gift-versus__tag">직접 참석</p>
            <p className="gift-versus__amount">10만 원</p>
            <p className="gift-versus__share">
              <span className="gift-meterbar" aria-hidden="true">
                <span style={{ width: '67.4%' }} />
              </span>
              응답자 67.4%가 선택
            </p>
          </div>
          <div className="gift-versus__vs" aria-hidden="true">
            VS
          </div>
          <div className="gift-versus__item">
            <p className="gift-versus__tag">봉투만</p>
            <p className="gift-versus__amount">5만 원</p>
            <p className="gift-versus__share">
              <span className="gift-meterbar" aria-hidden="true">
                <span style={{ width: '52.8%' }} />
              </span>
              응답자 52.8%가 선택
            </p>
          </div>
        </div>
        <p className="gift-callout">
          <strong>호텔 예식이면?</strong> 평균 축의금이 12만 원으로 올라가요.
        </p>
        <p>
          신한은행 조사에서 결혼식에 직접 가는 사람은 10만 원(67.4%)을, 가지 않고 봉투만 보내는 사람은 5만 원(52.8%)을 가장 많이 골랐어요.
          호텔 예식이면 평균이 12만 원으로 올라갔고요. 식사를 하지 않으니 불참할 때는 가볍게 내는 게 보통이지만, 아주 가까운 사이라면 참석할 때와
          같은 금액을 보내기도 해요.
        </p>
      </Section>

      <Section no="04" icon="meal" title="식대가 축의금을 정한다">
        <Bars
          caption="웨딩홀 1인 식대 (2026년)"
          max={120000}
          mark={{ value: 100000, label: '축의금 10만 원 (혼자 참석)' }}
          rows={[
            { label: '서울 강남', value: 90000, text: '약 9만 원', hi: true },
            { label: '서울', value: 80000, text: '약 8만 원' },
            { label: '경기·인천', value: 62000, text: '6만 2천 원' },
            { label: '전국', value: 60000, text: '6만 원' },
          ]}
        />
        <p>
          한국소비자원 참가격에 따르면 2026년 서울 예식장의 1인 식대 중간값은 약 8만 원, 경기·인천은 6만 2천 원, 전국은 6만 원이에요. 서울 강남은
          평균 9만 원 선까지 올라갔어요. 혼자 가면 10만 원으로 식대가 채워지지만 둘이 가면 15만~20만 원은 돼야 본전이에요. 이 계산기는 축의금이
          예상 식대의 90% 이상이 되도록 금액을 맞춰요.
        </p>
      </Section>

      <Section no="05" icon="people" title="직장 동료와 친구는 얼마나 낼까">
        <div className="gift-split gift-split--even">
          <Bars
            caption="안 친한 팀 동료에게 적당한 금액"
            max={100}
            unit="%"
            rows={[
              { label: '10만 원', value: 60.1, text: '60.1', hi: true },
              { label: '5만 원', value: 30, text: '30.0' },
            ]}
          />
          <Bars
            caption="친구 결혼식 참석 시 적정 금액"
            max={300000}
            rows={[
              { label: '미혼', value: 130000, text: '13만 원' },
              { label: '기혼', value: 290000, text: '29만 원', hi: true },
            ]}
          />
        </div>
        <p>
          인크루트가 2025년 직장인에게 물었더니, 별로 친하지 않은 같은 팀 동료에게는 10만 원이 적당하다는 답이 60.1%로 가장 많았어요. 결혼정보회사
          가연의 2026년 조사에서는 친구 결혼식에 참석할 때 적정 금액으로 미혼자가 평균 13만 원, 기혼자가 평균 29만 원을 꼽았어요. 기혼자는 상대가
          예전에 자기 결혼식에 낸 금액과 배우자 동행 여부를 함께 따지기 때문이에요.
        </p>
      </Section>

      <Section no="06" icon="envelope" title="축의금 봉투 쓰는 법">
        <div className="gift-split">
          <EnvelopeHowTo />
          <ol className="gift-steps">
            <li>
              앞면에는 <strong>祝結婚(축결혼)</strong>이나 <strong>祝華婚(축화혼)</strong>을 써요. 한글로 "축 결혼"이라고 써도 괜찮아요.
            </li>
            <li>뒷면 왼쪽 아래에 이름을 세로로 써요. 회사나 모임 이름을 함께 쓰면 신랑·신부가 누군지 알아보기 쉬워요.</li>
            <li>지폐는 같은 방향으로 가지런히 넣고, 가능하면 신권으로 준비해요.</li>
            <li>3·5·10만 원처럼 끊어지는 금액을 쓰고, 4가 들어가는 금액은 피하는 편이에요.</li>
          </ol>
        </div>
      </Section>

      <Section no="07" icon="faq" title="자주 묻는 질문">
        <div className="gift-faq">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                <span className="gift-faq__q" aria-hidden="true">
                  Q
                </span>
                {f.q}
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section icon="link" title="출처" className="gift-sources">
        <ul>
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
              <span>{s.by}</span>
            </li>
          ))}
        </ul>
        <p>2026년 11월에 정리한 자료예요. 식대와 시세는 지역과 예식장마다 달라요.</p>
      </Section>
    </article>
  )
}
