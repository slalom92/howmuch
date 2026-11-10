// 존버 계산기 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, ITEMS, MIN_WAGE, HOURS_PER_MONTH } from './jonber.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function JonberGuide({ ad = null }) {
  const used = [...new Set(['netpay', 'nettax', 'minwage', ...ITEMS.map((it) => it.src)])]
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>내 시급</strong> 고른 연봉의 한 달 급여 ÷ {HOURS_PER_MONTH}시간. {HOURS_PER_MONTH}시간은 주 40시간에 유급 주휴시간을 더한 한 달 근로시간으로, 최저임금 월급을 계산할 때와 같은 기준이에요.
          </li>
          <li>
            <strong>몇 시간 일해야</strong> 물건 가격 ÷ 내 시급. 하루는 8시간, 한 달은 {HOURS_PER_MONTH}시간으로 바꿔 보여 드려요.
          </li>
          <li>
            <strong>출근 시계</strong> 오전 9시 출근, 낮 12시부터 1시까지 점심시간은 빼고 일한 시간을 더했어요.
          </li>
          <li>
            <strong>최저시급이면</strong> 2026년 최저시급 {MIN_WAGE.toLocaleString('ko-KR')}원(세전)으로 같은 물건을 살 때 걸리는 시간이에요.
          </li>
        </ul>
      </section>

      {ad}

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
            <a href="/guide/take-home-pay/">연봉 실수령액은 어떻게 정해질까: 2026년 4대보험과 소득세</a>
          </li>
          <li>
            <a href="/guide/pir/">월급 모아 집 사기, 실제로는 몇 년 걸릴까: PIR로 보는 내 집 마련</a>
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
        <p>가격은 2026년 11월 10일에 정리했어요. 매장과 시기에 따라 실제 가격은 다를 수 있어요.</p>
      </section>
    </article>
  )
}
