// 월급 버티기 계산기 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, MIN_LIVING, SEOUL_RENT } from './survive.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function SurviveGuide({ ad = null }) {
  const used = ['netpay', 'nettax', 'oneperson', 'rent', 'minliving', 'minliving27']
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>월급</strong> 고른 연봉의 2026년 실수령액 ÷ 12. 세금과 4대보험은 이미 빠진 돈이에요.
          </li>
          <li>
            <strong>1인 가구 평균</strong> 2024년 1인 가구가 한 달에 쓴 돈 168만 9천 원을 12개 항목 그대로 썼어요.
          </li>
          <li>
            <strong>서울 원룸 자취</strong> 평균에서 집 항목만 서울 원룸 평균 월세 {(SEOUL_RENT / 10000).toLocaleString('ko-KR')}만 원으로 바꿨어요.
          </li>
          <li>
            <strong>최소 생활</strong> 2026년 1인 가구 생계급여 지급기준 {MIN_LIVING.toLocaleString('ko-KR')}원이에요.
          </li>
          <li>
            <strong>버티는 날</strong> 월급 ÷ 하루 생활비(한 달 생활비 ÷ 30.42일). 점 하나가 하루예요.
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
            <a href="/jonber/">존버 계산기: 이거 사려면 몇 시간 일해야 할까</a>
          </li>
          <li>
            <a href="/apt/">연봉 모아 집 사기: 남는 돈을 모으면 몇 년 걸릴까</a>
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
        <p>2026년 11월 10일에 정리했어요. 1인 가구 생활비는 매년 12월 새 통계가 나오면 바꿔요.</p>
      </section>
    </article>
  )
}
