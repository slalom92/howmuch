// 월 구독료 계산기 아래 안내 (계산 방법, 요금표, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, SERVICES, CATEGORIES, AS_OF, tierPriceText } from './subscription.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function SubscriptionGuide({ ad = null }) {
  const used = [...new Set([...SERVICES.flatMap((s) => s.src), 'chicken', 'ramen', 'morning', 'encar', 'netpay', 'nettax'])]
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>구독료</strong> 고른 요금제의 한 달 요금(부가세 포함)을 모두 더했어요. 1년권은 1년 값 ÷ 12예요.
          </li>
          <li>
            <strong>월급의 몇 %</strong> 한 달 구독료 ÷ 고른 연봉의 2026년 실수령액 ÷ 12.
          </li>
          <li>
            <strong>일하는 시간</strong> 구독료 ÷ 실수령 시급(실수령 월급 ÷ 209시간).
          </li>
          <li>
            <strong>치킨·라면</strong> 1년 구독료 ÷ 23,000원(BBQ 황금올리브), ÷ 1,000원(신라면 봉지).
          </li>
          <li>
            <strong>몇 년 모으면 이 차</strong> 중고 시세(5년 된 모닝부터 2023년식 카이엔 쿠페까지) ÷ 1년 구독료. 이자는 넣지 않았어요.
          </li>
        </ul>
      </section>

      {ad}

      <section className="kbo-card">
        <h2 className="kbo-card__title">서비스별 요금표</h2>
        <p className="sub-table__lede">{AS_OF} 기준, 부가세 포함 한 달 요금이에요.</p>
        {CATEGORIES.map((c) => (
          <div key={c.id} className="jb-table-wrap">
            <table className="jb-table sub-table">
              <caption>{c.label}</caption>
              <thead>
                <tr>
                  <th scope="col">서비스</th>
                  <th scope="col">요금제</th>
                  <th scope="col" className="num">
                    요금
                  </th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.filter((s) => s.cat === c.id).flatMap((s) =>
                  s.tiers.map((t, i) => (
                    <tr key={`${s.id}-${t.id}`}>
                      {i === 0 ? (
                        <th scope="rowgroup" rowSpan={s.tiers.length}>
                          {s.name}
                        </th>
                      ) : null}
                      <td>
                        {t.label}
                        {t.note && <small> {t.note}</small>}
                      </td>
                      <td className="num">{tierPriceText(t)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section className="kbo-card">
        <h2 className="kbo-card__title">자주 묻는 질문</h2>
        <div className="kbo-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="kbo-card kbo-sources">
        <h2 className="kbo-card__title">더 읽어 보기</h2>
        <ul>
          <li>
            <a href="/survive/">존버 계산기: 월급 한 번으로 며칠 버틸까</a>
          </li>
          <li>
            <a href="/jonber/">월급 분당 계산기: 이거 사려면 몇 시간 일해야 할까</a>
          </li>
          <li>
            <a href="/car/">자차 계산기: 내 연봉에 맞는 차와 3년 감가</a>
          </li>
          <li>
            <a href="/guide/take-home-pay/">연봉 실수령액은 어떻게 정해질까: 2026년 4대보험과 소득세</a>
          </li>
        </ul>
      </section>

      <section className="kbo-card kbo-sources">
        <h2 className="kbo-card__title">출처</h2>
        <ul>
          {used.map((id) => (
            <li key={id}>
              <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">
                {SOURCES[id].label}
              </a>
            </li>
          ))}
        </ul>
        <p>{AS_OF}에 정리했어요. 요금이 바뀌면 고쳐요. 앱 결제, 통신사 결합, 카드 할인 가격은 넣지 않았어요.</p>
      </section>
    </article>
  )
}
