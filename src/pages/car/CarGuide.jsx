// 자차 계산기 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, CARS, CAR_RATIO, USED_AS_OF } from './car.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function CarGuide({ ad = null }) {
  const used = [...new Set(['encar', ...CARS.map((c) => c.newSrc).filter(Boolean), 'ratio', 'netpay', 'nettax'])]
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>내 연봉에 맞아?</strong> 차값이 세전 연봉의 {Math.round(CAR_RATIO * 100)}% 이내면 맞는 차로 봤어요. 재무 가이드에서 흔히 권하는 기준이에요.
          </li>
          <li>
            <strong>차값</strong> 2023년식과 같은 트림의 2023년 당시 신차 가격(옵션 제외)이에요. 신차 가격을 찾지 못한 차는 지금 중고 시세로 판정해요.
          </li>
          <li>
            <strong>3년 타면 사라진 돈</strong> 2023년 신차 가격 − 엔카 {USED_AS_OF.replace('-', '년 ')}월 중고 시세(2023년식, 6만km, 무사고).
          </li>
          <li>
            <strong>몇 시간, 몇 달 일해야</strong> 실수령 연봉 ÷ 12 ÷ 209시간을 시급으로 썼어요. 하루는 8시간이에요.
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
            <a href="/jonber/">월급 분당 계산기: 이거 사려면 몇 시간 일해야 할까</a>
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
        <p>2026년 11월 12일에 정리했어요. 엔카 시세는 매달 바뀌어요.</p>
      </section>
    </article>
  )
}
