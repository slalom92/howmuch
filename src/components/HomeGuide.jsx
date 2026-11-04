import { RPM, SHORTS_MAX_SEC } from '../lib/calc.js'

// 홈 화면 안내: 돈미터 소개, 계산 순서, 자주 묻는 질문, 더 읽을거리.
// 검색 전 화면에 보이고, 같은 내용이 index.html 에도 미리 들어가 있어
// 자바스크립트를 실행하지 않는 검색·광고 심사 로봇도 읽을 수 있다.

const won = (n) => `${n.toLocaleString('ko-KR')}원`

const FAQ = [
  {
    q: '여기 나온 금액이 실제 수익인가요?',
    a: (
      <>
        아니요. YouTube에 공개된 구독자 수와 최근 영상 조회수에 광고 단가 가정값을 곱해 돈미터가 따로 계산한 추정치예요. 실제 수익은 채널
        운영자만 YouTube 스튜디오에서 볼 수 있고, Google이나 YouTube가 발표하거나 승인한 수치가 아니에요. 주제와 시청자 국가, 시기에 따라 몇 배까지
        차이 날 수 있어요.
      </>
    ),
  },
  {
    q: '왜 구독자 수가 아니라 조회수로 계산하나요?',
    a: (
      <>
        광고 수익은 영상이 재생될 때 붙는 광고에서 나와요. 구독자가 많아도 새 영상을 보지 않으면 수익이 생기지 않고, 구독자가 적어도 추천으로
        조회수가 잘 나오면 수익이 커요. 그래서 최근 영상의 평균 조회수와 업로드 빈도를 기준으로 계산해요. 자세한 예시는{' '}
        <a href="/guide/subscriber-income/">구독자 수별 수익 글</a>에 있어요.
      </>
    ),
  },
  {
    q: '쇼츠 수익은 왜 이렇게 적게 나오나요?',
    a: (
      <>
        쇼츠는 영상 사이에 나오는 광고 수익을 한데 모은 뒤 조회수 비중대로 나누는 방식이라, 1,000회당 수익이 롱폼보다 훨씬 낮아요. 돈미터는{' '}
        {SHORTS_MAX_SEC / 60}분 이하 영상을 쇼츠로 보고 따로 계산해요. 구조는 <a href="/guide/shorts-vs-longform/">쇼츠와 롱폼 비교 글</a>에 정리했어요.
      </>
    ),
  },
  {
    q: '보수적·보통·높게는 무엇이 다른가요?',
    a: (
      <>
        조회수 1,000회당 크리에이터가 받는 금액(RPM) 가정이에요. 롱폼은 {won(RPM.low.long)}·{won(RPM.mid.long)}·{won(RPM.high.long)}, 쇼츠는{' '}
        {won(RPM.low.short)}·{won(RPM.mid.short)}·{won(RPM.high.short)}으로 계산해요. RPM이 무엇인지는 <a href="/guide/rpm/">RPM 설명 글</a>을 참고하세요.
      </>
    ),
  },
  {
    q: '협찬, 멤버십, 슈퍼챗 수익도 들어가나요?',
    a: '아니요. 광고 수익만 계산해요. 실제 유튜버 수입에는 협찬, 채널 멤버십, 슈퍼챗, 쇼핑 수익 등이 더해질 수 있어요.',
  },
  {
    q: '"우리 회사에 다닌다면?"은 어떻게 계산하나요?',
    a: '상장사는 금융감독원 전자공시의 직원 평균 연봉과 근속연수를, 그 밖의 회사는 기업 규모·업종별 평균 임금 통계를 써요. 여기에 일반적인 승진 시점과 직급별 연봉 차이를 적용해 몇 년차 어느 직급 수준인지 추정해요. 실제 회사의 연봉 테이블과는 달라요.',
  },
  {
    q: '"나도 이만큼 벌려면?"은 어떻게 계산하나요?',
    a: '검색한 유튜버의 구독자 대비 조회수 비율을 내 구독자 수에 적용해 내 영상 한 편의 조회수를 어림하고, 같은 수익에 필요한 영상 수와 조회수를 계산해요. 구독자 도달 기간은 구독자 1천·1만·10만 명에 도달한 채널들의 평균 기간을 바탕으로 한 추정이에요.',
  },
  {
    q: '찾는 채널이 검색되지 않아요.',
    a: '채널 이름 대신 @핸들(예: @채널이름)이나 채널 주소(youtube.com/@… 또는 youtube.com/channel/…)를 넣어 보세요. 이름 검색은 하루 사용량이 정해져 있어 많이 몰리면 잠시 막힐 수 있지만, @핸들 검색은 대부분 바로 돼요.',
  },
]

export default function HomeGuide() {
  return (
    <section className="home-guide" aria-labelledby="home-guide-title">
      <h2 id="home-guide-title" className="home-guide__title">
        돈미터는 이런 곳이에요
      </h2>
      <p>
        "저 유튜버는 한 달에 얼마나 벌까?" 궁금할 때 채널 이름만 넣으면, 최근 영상 조회수로 하루·한 달·1년 광고 수익을 추정해 급여명세서처럼
        보여 드려요. 직장인 평균 월급이나 우리 회사 연봉과 나란히 놓아 보고, 내 채널로 같은 수익을 내려면 영상이 몇 편 필요한지도 계산할 수 있어요.
      </p>
      <p>모든 숫자는 공개 데이터로 계산한 재미용 추정치예요. 계산 방식과 한계를 아래에 모두 공개해 둘게요.</p>

      <h3 className="home-guide__sub">이렇게 계산해요</h3>
      <ol className="home-guide__steps">
        <li>
          <strong>최근 영상 불러오기</strong>
          <span>YouTube에 공개된 최근 업로드 영상 최대 50개의 조회수, 길이, 올린 날짜를 가져와요.</span>
        </li>
        <li>
          <strong>롱폼과 쇼츠 나누기</strong>
          <span>
            {SHORTS_MAX_SEC / 60}분 이하 영상은 쇼츠로 보고, 유형별로 평균 조회수(조회수 상·하위 10%는 제외)와 한 달 업로드 수를 구해요.
          </span>
        </li>
        <li>
          <strong>광고 단가 곱하기</strong>
          <span>한 달 동안 새로 생기는 조회수에 1,000회당 크리에이터 수익(RPM) 가정값을 곱해 광고 수익을 추정해요.</span>
        </li>
      </ol>

      <h3 className="home-guide__sub">자주 묻는 질문</h3>
      <div className="home-guide__faq">
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <h3 className="home-guide__sub">더 읽어 보기</h3>
      <ul className="home-guide__links">
        <li>
          <a href="/guide/rpm/">유튜브 RPM과 CPM, 무엇이 다를까</a>
        </li>
        <li>
          <a href="/guide/shorts-vs-longform/">쇼츠와 롱폼, 같은 100만 조회수인데 수익은 왜 다를까</a>
        </li>
        <li>
          <a href="/guide/subscriber-income/">구독자 1만, 10만, 100만 유튜버는 한 달에 얼마 벌까</a>
        </li>
        <li>
          <a href="/channel/">유튜버별 유튜브 수익 모아 보기</a>
        </li>
      </ul>
    </section>
  )
}
