import { SEASON, LEAGUE, SOURCES } from './kbo.js'

// 결과 아래 안내 글 (검색·광고 심사용 본문이기도 하다)
// 질문과 답은 kbo/index.html 의 FAQ 구조화 데이터와 같게 유지한다.
export const FAQ = [
  {
    q: '프로야구 연봉에 계약금도 들어 있나요?',
    a: '아니요. 여기 금액은 그해 받는 연봉만이에요. FA 계약의 계약금과 성적에 따른 옵션(인센티브)은 따로 받기 때문에 실제 수입은 더 많을 수 있어요.',
  },
  {
    q: '같은 선수인데 해마다 연봉이 왜 이렇게 달라요?',
    a: '여러 해 계약을 맺으면 총액은 정해 두고 해마다 받을 금액을 나눠요. 샐러리캡(구단 연봉 총액 상한)을 맞추려고 특정 해에 몰아서 주거나, 계약 마지막 해에 일부러 낮추기도 해요.',
  },
  {
    q: '외국인 선수 연봉은 왜 없나요?',
    a: '외국인과 아시아쿼터 선수는 달러로 계약하고, KBO 평균 연봉 집계에서도 빠져요. 국내 선수와 같은 기준으로 비교하기 어려워 이 목록에는 넣지 않았어요.',
  },
  {
    q: '찾는 선수가 없어요.',
    a: 'KBO는 모든 선수의 연봉표를 공개하지 않아요. 그래서 KBO나 구단이 발표해 보도된 선수만 넣었어요. 새 발표가 나오면 계속 추가할게요.',
  },
]

export default function KboGuide() {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">{SEASON} 프로야구 연봉, 숫자로 보면</h2>
        <dl className="kbo-facts">
          <div>
            <dt>평균 연봉</dt>
            <dd>1억 7,536만 원</dd>
            <p>신인, 외국인, 아시아쿼터를 뺀 {LEAGUE.players}명 평균으로 역대 최고예요. 작년(1억 6,071만 원)보다 9.1% 올랐어요.</p>
          </div>
          <div>
            <dt>최고 연봉</dt>
            <dd>42억 원</dd>
            <p>두산 양의지. 작년 16억 원에서 26억 원이 올라 역대 최고 인상액이에요.</p>
          </div>
          <div>
            <dt>최고 인상률</dt>
            <dd>800%</dd>
            <p>NC 구창모. 1억 원에서 9억 원이 됐어요.</p>
          </div>
          <div>
            <dt>최저 연봉</dt>
            <dd>3,000만 원</dd>
            <p>KBO 규정에 따른 최저 연봉이에요. 신인 입단 계약의 연봉도 대부분 여기서 시작해요.</p>
          </div>
        </dl>
      </section>

      <section className="kbo-card">
        <h2 className="kbo-card__title">연봉을 이렇게 나눴어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>1경기</strong> 연봉 ÷ 정규시즌 144경기. 출전하지 않은 경기도 똑같이 나눴어요.
          </li>
          <li>
            <strong>1이닝</strong> 1경기 금액 ÷ 9이닝. 투수와 타자 모두 같은 방식이에요.
          </li>
          <li>
            <strong>하루, 1시간, 1초</strong> 연봉 ÷ 365일, 다시 24시간, 3,600초. 쉬는 날과 비시즌도 모두 넣었어요.
          </li>
          <li>
            <strong>직장인 평균</strong> 국가데이터처 2024년 임금근로일자리 평균 소득(월 375만 원)을 12달로 곱한 4,500만 원이에요.
          </li>
        </ul>
      </section>

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
        <h2 className="kbo-card__title">출처</h2>
        <ul>
          {['kbo', 'kbo_x', 'minimum'].map((id) => (
            <li key={id}>
              <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">
                {SOURCES[id].label}
              </a>
            </li>
          ))}
        </ul>
        <p>선수별 출처는 선수를 고르면 결과 아래에 나와요. 2026년 11월에 정리했어요.</p>
      </section>
    </article>
  )
}
