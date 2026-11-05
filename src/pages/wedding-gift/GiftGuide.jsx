import { won } from '../../lib/format.js'
import { RELATIONS } from './gift.js'

// 계산기 아래 안내 글 (검색·광고 심사용 본문이기도 하다)
// 질문과 답은 wedding-gift/index.html 의 FAQ 구조화 데이터와 같게 유지한다.
export const FAQ = [
  {
    q: '축의금을 계좌이체로 보내도 괜찮을까요?',
    a: '모바일 청첩장에 계좌가 적혀 있다면 이체도 흔한 방법이에요. 이름만 찍히면 누군지 모를 수 있으니 받는 분 표시에 이름과 관계를 함께 남기고, 축하 메시지도 따로 보내면 좋아요.',
  },
  {
    q: '부부나 가족이 함께 가면 얼마를 내야 하나요?',
    a: '먹는 사람 수만큼 식대가 들어요. 서울 웨딩홀이라면 둘이 갈 때 15만~20만 원은 돼야 식대가 채워지는 경우가 많아요. 계산기에서 인원을 바꾸면 바로 반영돼요.',
  },
  {
    q: '내 결혼식 때 받은 금액보다 적게 내도 될까요?',
    a: '받은 만큼 돌려주는 것이 기본이에요. 몇 년이 지났다면 그사이 오른 식대를 생각해 한 단계 올려 내는 사람도 많아요.',
  },
  {
    q: '이 계산기 금액이 정답인가요?',
    a: '아니요. 공개된 설문과 식대 통계로 만든 참고선이에요. 서로의 형편과 관계, 지역 관습에 따라 달라질 수 있어요.',
  },
]

const SOURCES = [
  { href: 'https://www.thestar.com.my/aseanplus/aseanplus-news/2026/05/14/at-korean-weddings-the-traditional-50000-won-envelope-is-losing-ground', label: 'NH농협은행 축의금 이체 분석, 인크루트 직장인 설문 (Korea Herald, 2026년 5월)' },
  { href: 'https://www.inews24.com/view/1710001', label: '신한은행 보통사람 금융생활 보고서 (아이뉴스24)' },
  { href: 'https://economist.co.kr/article/view/ecn202608280005', label: '가연 결혼 비용 및 축의금 인식 조사 (이코노미스트, 2026년 8월)' },
  { href: 'https://www.ytn.co.kr/_ln/0103_202610132323067450', label: '한국소비자원 참가격 예식장 식대 (YTN, 2026년 10월)' },
  { href: 'https://www.price.go.kr/', label: '한국소비자원 참가격' },
]

const range = (a, b) => (a === b ? won(a) : `${won(a)} ~ ${won(b)}`)

export default function GiftGuide() {
  return (
    <article className="gift-guide">
      <section>
        <h2 className="gift-sec__title">관계별 축의금 기준표 (2026년)</h2>
        <p>혼자 참석하고 서울 웨딩홀 식대(1인 약 8만 원)일 때를 기준으로 정리했어요. 둘 이상 가거나 호텔 예식이면 식대만큼 더 올라가요.</p>
        <table className="gift-table">
          <thead>
            <tr>
              <th scope="col">관계</th>
              <th scope="col" className="num">
                직접 참석
              </th>
              <th scope="col" className="num">
                봉투만
              </th>
            </tr>
          </thead>
          <tbody>
            {RELATIONS.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                <td className="num">{range(Math.max(r.attend, 100000), Math.max(r.attendMore, 100000))}</td>
                <td className="num">{range(r.absent, r.absentMore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="gift-sec__title">요즘 축의금, 5만 원은 적을까?</h2>
        <p>
          NH농협은행이 고객들의 축의금 이체를 분석해 보니 2025년 평균은 11만 7천 원이었어요. 2023년 11만 원에서 꾸준히 올랐고, 5만 원을 보내는
          비중은 줄어든 반면 10만 원을 보내는 비중은 늘었어요. 직접 참석한다면 10만 원이 사실상 기본값이 된 셈이에요.
        </p>
      </section>

      <section>
        <h2 className="gift-sec__title">참석할 때와 봉투만 보낼 때</h2>
        <p>
          신한은행 조사에서 결혼식에 직접 가는 사람은 10만 원(67.4%)을, 가지 않고 봉투만 보내는 사람은 5만 원(52.8%)을 가장 많이 골랐어요.
          호텔 예식이면 평균이 12만 원으로 올라갔고요. 식사를 하지 않으니 불참할 때는 가볍게 내는 게 보통이지만, 아주 가까운 사이라면 참석할 때와
          같은 금액을 보내기도 해요.
        </p>
      </section>

      <section>
        <h2 className="gift-sec__title">식대가 축의금을 정한다</h2>
        <p>
          한국소비자원 참가격에 따르면 2026년 서울 예식장의 1인 식대 중간값은 약 8만 원, 경기·인천은 6만 2천 원, 전국은 6만 원이에요. 서울 강남은
          평균 9만 원 선까지 올라갔어요. 혼자 가면 10만 원으로 식대가 채워지지만 둘이 가면 15만~20만 원은 돼야 본전이에요. 이 계산기는 축의금이
          예상 식대의 90% 이상이 되도록 금액을 맞춰요.
        </p>
      </section>

      <section>
        <h2 className="gift-sec__title">직장 동료와 친구는 얼마나 낼까</h2>
        <p>
          인크루트가 2025년 직장인에게 물었더니, 별로 친하지 않은 같은 팀 동료에게는 10만 원이 적당하다는 답이 60.1%로 가장 많았어요. 결혼정보회사
          가연의 2026년 조사에서는 친구 결혼식에 참석할 때 적정 금액으로 미혼자가 평균 13만 원, 기혼자가 평균 29만 원을 꼽았어요. 기혼자는 상대가
          예전에 자기 결혼식에 낸 금액과 배우자 동행 여부를 함께 따지기 때문이에요.
        </p>
      </section>

      <section>
        <h2 className="gift-sec__title">축의금 봉투 쓰는 법</h2>
        <ul className="gift-list">
          <li>
            앞면에는 <strong>祝結婚(축결혼)</strong>이나 <strong>祝華婚(축화혼)</strong>을 써요. 한글로 "축 결혼"이라고 써도 괜찮아요.
          </li>
          <li>뒷면 왼쪽 아래에 이름을 세로로 써요. 회사나 모임 이름을 함께 쓰면 신랑·신부가 누군지 알아보기 쉬워요.</li>
          <li>지폐는 같은 방향으로 가지런히 넣고, 가능하면 신권으로 준비해요.</li>
          <li>3·5·10만 원처럼 끊어지는 금액을 쓰고, 4가 들어가는 금액은 피하는 편이에요.</li>
        </ul>
      </section>

      <section>
        <h2 className="gift-sec__title">자주 묻는 질문</h2>
        <dl className="gift-faq">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="gift-sources">
        <h2 className="gift-sec__title">출처</h2>
        <ul>
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p>2026년 11월에 정리한 자료예요. 식대와 시세는 지역과 예식장마다 달라요.</p>
      </section>
    </article>
  )
}
