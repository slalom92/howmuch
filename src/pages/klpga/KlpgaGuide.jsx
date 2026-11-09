// 프로골프 상금 화면 아래 안내 (숫자, 계산 방법, 자주 묻는 질문, 출처). 문구는 투어 자료(T.guide, T.FAQ)에 있다.
export default function KlpgaGuide({ T }) {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">
          {T.SEASON} {T.text.who} 상금, 숫자로 보면
        </h2>
        <dl className="kbo-facts">
          {T.guide.facts.map((f) => (
            <div key={f.dt}>
              <dt>{f.dt}</dt>
              <dd>{f.dd}</dd>
              <p>{f.p}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="kbo-card">
        <h2 className="kbo-card__title">상금을 이렇게 나눴어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>한 달</strong> 시즌 상금 ÷ 12달. 대회가 없는 겨울도 모두 넣었어요.
          </li>
          <li>
            <strong>투어 하루</strong> {T.guide.daysHow}
          </li>
          <li>
            <strong>하루, 1시간, 1초</strong> 시즌 상금 ÷ 365일, 다시 24시간, 3,600초.
          </li>
          <li>
            <strong>대회 하나에</strong> 시즌 상금 ÷ 출전한 대회 수. 출전 수가 알려진 선수만 계산했어요.{T.EVENTS_HELD ? ` 올해는 ${T.EVENTS_HELD}개 대회가 열렸어요.` : ''}
          </li>
          <li>
            <strong>1타에</strong> 대회 하나 평균 상금 ÷ {T.PAR * T.ROUNDS}타. 한 대회를 {T.PAR}타씩 {T.ROUNDS}라운드 친다고 봤어요. 컷 탈락으로 2라운드만 친 대회나 3라운드 대회도 모두 {T.ROUNDS}라운드로 셈해서, 실제 타수와는 차이가 있어요.
          </li>
          <li>
            <strong>직장인 평균</strong> 국가데이터처 2024년 임금근로일자리 평균 소득(월 375만 원)을 12달로 곱한 4,500만 원이에요.
          </li>
        </ul>
      </section>

      <section className="kbo-card">
        <h2 className="kbo-card__title">자주 묻는 질문</h2>
        <div className="kbo-faq">
          {T.FAQ.map((f, i) => (
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
          {T.guide.sources.map((id) => (
            <li key={id}>
              <a href={T.SOURCES[id].url} target="_blank" rel="noopener noreferrer">
                {T.SOURCES[id].label}
              </a>
            </li>
          ))}
        </ul>
        <p>선수별 출처는 선수를 고르면 결과 아래에 나와요. 2026년 11월 9일에 정리했어요.</p>
      </section>
    </article>
  )
}
