// 연봉 모아 집 사기 화면 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { DATA, FAQ, SOURCES, SALARIES } from './apt.js'

// 원 → "1억 840만 원", "3,912만 원"
const man = (v) => {
  const m = Math.round(v / 1e4)
  const eok = Math.floor(m / 1e4)
  const rest = m % 1e4
  if (!eok) return `${rest.toLocaleString('ko-KR')}만 원`
  return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만 원` : `${eok}억 원`
}
const period = DATA.from ? `${DATA.from.replace('-', '년 ')}월부터 ${DATA.to.replace('-', '년 ')}월까지` : '최근 1년'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function AptGuide({ ad = null }) {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>모인 돈</strong> 1년에 모으는 돈 × 모으는 기간. 이자, 물가, 연봉 인상은 넣지 않았어요.
          </li>
          <li>
            <strong>1년에 모으는 돈</strong> 기본은 실수령액이에요. 연봉 {SALARIES.map((s) => s.label).join(', ')} 원의 2026년 연 실수령액({SALARIES.map((s) => man(s.net)).join(', ')})을 썼어요. '생활비 빼고'를 고르면 월급 버티기 계산기와 같은 1인 가구 생활비를 빼고 남는 돈만 모아요.
          </li>
          <li>
            <strong>아파트 가격</strong> {period} 신고된 전국 아파트 매매 실거래 중 같은 단지, 같은 면적 거래가의 중간값이에요. 최근 거래일수록 무게를 더 둬서, 3개월 전 거래는 이번 달 거래의 절반, 6개월 전 거래는 4분의 1만큼만 반영해요. 계약 해제와 직거래는 뺐어요.
          </li>
          <li>
            <strong>몇 년 모으면</strong> 아파트 가격 ÷ 1년에 모으는 돈. 개월은 올림했어요.
          </li>
        </ul>
      </section>

      {ad}

      <section className="kbo-card">
        <h2 className="kbo-card__title">자주 묻는 질문</h2>
        <div className="kbo-faq">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                <span className="kbo-faq__q" aria-hidden="true">
                  Q
                </span>
                {f.q}
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="kbo-card kbo-sources">
        <h2 className="kbo-card__title">더 읽어 보기</h2>
        <ul>
          <li>
            <a href="/guide/pir/">월급 모아 집 사기, 실제로는 몇 년 걸릴까: PIR로 보는 내 집 마련</a>
          </li>
          <li>
            <a href="/guide/apt-real-price/">아파트 실거래가 제대로 읽는 법: 신고 30일, 해제 거래, 중간값</a>
          </li>
          <li>
            <a href="/guide/take-home-pay/">연봉 실수령액은 어떻게 정해질까: 2026년 4대보험과 소득세</a>
          </li>
        </ul>
      </section>

      <section className="kbo-card kbo-sources">
        <h2 className="kbo-card__title">출처</h2>
        <ul>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        {DATA.updated && <p className="kbo-card__note">아파트 자료는 {DATA.updated.replace(/-/g, '.')}에 받았어요. 한 달에 한 번 새로 받아요.</p>}
      </section>
    </article>
  )
}
