// 주식 물타기 계산기 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, FEE, TAX, pctPlain } from './stock.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function StockGuide({ ad = null }) {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>평균 단가</strong> 매수 내역마다 (주식 수 × 1주 가격)을 더한 총 매수 금액 ÷ 전체 주식 수.
          </li>
          <li>
            <strong>손익</strong> (지금 가격 − 평균 단가) × 주식 수. 수익률은 손익 ÷ 총 매수 금액이에요.
          </li>
          <li>
            <strong>본전까지 올라야 하는 비율</strong> 평균 단가 ÷ 지금 가격 − 1. 20% 빠지면 25%, 50% 빠지면 100% 올라야 본전이에요.
          </li>
          <li>
            <strong>물타기 주식 수</strong> 목표 수익률이 t일 때 새 평균 단가는 지금 가격 ÷ (1 + t). 지금 가격으로 x주 더 사서 평균 단가를 거기까지 낮추는 x = 주식 수 × (평균 단가 − 새 평균 단가) ÷ (새 평균 단가 − 지금 가격)을 올림했어요.
          </li>
          <li>
            <strong>지금 팔면 손에 남는 돈</strong> 평가 금액 − 매수 금액 − 증권거래세 {pctPlain(TAX, 2)} − 사고팔 때 매매 수수료 {pctPlain(FEE, 3)}(증권사마다 달라 어림).
          </li>
          <li>
            <strong>내 월급으로</strong> 고른 연봉의 실수령 월급(연봉 ÷ 12)과 시급(월급 ÷ 209시간)으로 바꿨어요.
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
            <a href="/guide/averaging-down/">물타기의 수학: 왜 20% 빠지면 25% 올라야 본전일까</a>
          </li>
          <li>
            <a href="/guide/take-home-pay/">연봉 실수령액은 어떻게 정해질까: 2026년 4대보험과 소득세</a>
          </li>
          <li>
            <a href="/survive/">존버 계산기: 내 월급으로 며칠 버틸까</a>
          </li>
          <li>
            <a href="/jonber/">월급 분당 계산기: 이거 사려면 몇 시간 일해야 할까</a>
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
      </section>
    </article>
  )
}
