// 관리비 계산기 아래 안내 (계산 방법, 지역별 평균표, 자주 묻는 질문, 출처)
import { FAQ, SOURCES, REGIONS, SEASONS, SMALL_AVG, AS_OF } from './managefee.js'

const n = (v) => Math.round(v).toLocaleString('ko-KR')
const WINTER = SEASONS.find((s) => s.id === 'winter').w

// ad: 첫 카드(이렇게 계산했어요) 다음에 넣을 광고. 모바일 본문 중간 광고 자리
export default function ManageFeeGuide({ ad = null }) {
  return (
    <article className="kbo-guide">
      <section className="kbo-card">
        <h2 className="kbo-card__title">이렇게 계산했어요</h2>
        <ul className="kbo-how">
          <li>
            <strong>아파트 평균</strong> 고른 지역의 K-apt 전용면적 1㎡당 1년 평균 관리비 × 고른 전용면적. 지역 값이 따로 없는 시도는 전국 평균으로 비교해요.
          </li>
          <li>
            <strong>겨울</strong> 위 평균 × {WINTER.toFixed(2)}. 2026년 1월 전국 평균(㎡당 3,343원)이 1년 평균(2,957원)보다 높은 비율이에요.
          </li>
          <li>
            <strong>오피스텔·원룸</strong> 서울 대학가 전용 33㎡ 이하 매물 평균(오피스텔 약 {n(SMALL_AVG.officetel / 10000)}만 원, 원룸 {(SMALL_AVG.oneroom / 10000).toFixed(1)}만 원)과 비교해요.
          </li>
          <li>
            <strong>등급</strong> 평균보다 15% 이상 적게 내면 방어 만렙, 10% 더 내는 데까지는 평균, 30%까지는 조금 더, 그보다 많으면 폭탄 경보예요.
          </li>
          <li>
            <strong>누적</strong> 관리비가 매년 3% 오른다고 가정하고 1년·5년·10년을 더했어요.
          </li>
          <li>
            <strong>굴렸다면</strong> 매달 관리비만큼을 연 8%(월 복리)로 10년 동안 모았다고 가정한 값이에요.
          </li>
          <li>
            <strong>치킨</strong> 1년 관리비 ÷ 23,000원(BBQ 황금올리브).
          </li>
        </ul>
      </section>

      {ad}

      <section className="kbo-card">
        <h2 className="kbo-card__title">지역별 아파트 평균 관리비</h2>
        <p className="sub-table__lede">K-apt 2025년 9월~2026년 9월, 전용면적 1㎡당 한 달 관리비예요. 59㎡·84㎡는 그 값에 면적을 곱했어요.</p>
        <div className="jb-table-wrap">
          <table className="jb-table sub-table">
            <thead>
              <tr>
                <th scope="col">지역</th>
                <th scope="col" className="num">
                  ㎡당
                </th>
                <th scope="col" className="num">
                  59㎡
                </th>
                <th scope="col" className="num">
                  84㎡
                </th>
                <th scope="col" className="num">
                  84㎡ 1월
                </th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td className="num">{n(r.perM2)}원</td>
                  <td className="num">{n(Math.round((r.perM2 * 59) / 100) * 100)}원</td>
                  <td className="num">{n(Math.round((r.perM2 * 84) / 100) * 100)}원</td>
                  <td className="num">{n(Math.round((r.perM2 * 84 * WINTER) / 100) * 100)}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <a href="/subscription/">월 구독료 계산기: 매달 자동이체로 나가는 돈</a>
          </li>
          <li>
            <a href="/survive/">존버 계산기: 월급 한 번으로 며칠 버틸까</a>
          </li>
          <li>
            <a href="/commute/">직주근접 계산기: 회사 근처 집, 얼마면 될까</a>
          </li>
          <li>
            <a href="/apt/">연봉 모아 집 사기: 몇 년이면 내 집 마련</a>
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
        <p>{AS_OF}에 정리했어요. 평균은 단지 전체를 모은 값이라 우리 집 고지서와는 층·향·난방 방식·사용량에 따라 차이가 날 수 있어요.</p>
      </section>
    </article>
  )
}
