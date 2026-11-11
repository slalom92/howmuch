// 직주근접 계산기 아래 안내 (계산 방법, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, ROOM_MAX, WORKDAYS } from './commute.js'

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function CommuteGuide({ ad = null, rate }) {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>계약</strong> 국토교통부에 신고된 최근 전월세 실거래 계약이에요. 매물이 아니라 이미 맺어진 계약이라, 그 동네 시세를 보는 참고 자료예요.
          </li>
          <li>
            <strong>원룸</strong> 빌라·오피스텔·단독다가구 계약 중 면적 {ROOM_MAX}㎡(약 10평) 이하예요.
          </li>
          <li>
            <strong>역까지 거리</strong> 계약된 동과 번지를 카카오맵에서 찾아 역까지 직선 거리를 쟀어요. 번지가 공개되지 않은 단독다가구는 동 중심으로 쟀어요.
          </li>
          <li>
            <strong>한 달 집값</strong> 월세 + 보증금을 전세대출 금리 연 {(rate * 100).toFixed(2)}%로 빌렸을 때의 한 달 이자. 관리비와 공과금은 빠져 있어요.
          </li>
          <li>
            <strong>출퇴근 시간</strong> 카드를 누르면 카카오맵으로 집에서 역까지 걷는 길과 대중교통 길을 찾아요. 한 달 출퇴근 시간은 편도 시간 × 2 × 한 달 출근일 {WORKDAYS.toFixed(1)}일이에요.
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
            <a href="/survive/">존버 계산기: 이 집 월세로 월급 한 번에 며칠 버틸까</a>
          </li>
          <li>
            <a href="/apt/">연봉 모아 집 사기: 몇 년 모으면 이 아파트를 살까</a>
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
        <p>2026년 11월 11일에 만들었어요. 계약 자료는 사이트를 다시 만들 때마다 최근 6개월로 바꿔요.</p>
      </section>
    </article>
  )
}
