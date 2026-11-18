// 첫 화면 아래 안내: 유튜버 수익을 어떻게 어림하고, 숫자를 어떻게 읽으면 되는지.
// 검색 로봇과 처음 온 사람이 계산기를 쓰기 전에 읽는 본문이라 미리 그린 HTML에 들어간다 (scripts/prerender-home.mjs).
// 예시 금액은 lib/calc.js 의 RPM 가정값으로 계산하므로, 가정값을 바꾸면 여기 숫자도 같이 바뀐다.
import { RPM, SHORTS_MAX_SEC } from '../lib/calc.js'
import { COMPARE } from '../lib/compare.js'

const LINKS = [
  { href: '/how/', title: '계산 방법', desc: '숫자가 어떻게 나오는지 세 단계로 설명해요.' },
  { href: '/faq/', title: '자주 묻는 질문', desc: '실제 수익인가요? 협찬도 들어가나요?' },
  { href: '/guide/', title: '돈 가이드', desc: '유튜브 RPM부터 연봉 실수령액, 선수 연봉, 내 집 마련까지 정리했어요.' },
]

const READ_MORE = [
  { href: '/guide/rpm/', title: '유튜브 RPM과 CPM, 무엇이 다를까' },
  { href: '/guide/shorts-vs-longform/', title: '쇼츠와 롱폼, 같은 100만 조회수인데 수익은 왜 다를까' },
  { href: '/guide/beyond-ads/', title: '광고 말고 유튜버가 버는 돈: 멤버십, 슈퍼챗, 쇼핑, 협찬' },
  { href: '/guide/monetization-requirements/', title: '유튜브 수익 창출 조건: 구독자 500명과 1,000명은 무엇이 다를까' },
  { href: '/guide/subscriber-income/', title: '구독자 1만, 10만, 100만 유튜버는 한 달에 얼마 벌까' },
]

// 예시 채널: 롱폼 평균 20만 회 × 한 달 8편, 쇼츠 평균 50만 회 × 한 달 12편
const EXAMPLE = { long: { views: 200000, uploads: 8 }, short: { views: 500000, uploads: 12 } }
const monthViews = (k) => EXAMPLE[k].views * EXAMPLE[k].uploads
const revenue = (tier, k) => (monthViews(k) / 1000) * RPM[tier][k]
const total = (tier) => revenue(tier, 'long') + revenue(tier, 'short')
const man = (n) => `${Math.round(n / 10000).toLocaleString('ko-KR')}만`
const AVG = COMPARE.find((c) => c.id === 'avg')

export default function HomeGuide() {
  return (
    <>
      <article className="yt-guide" aria-labelledby="yt-guide-title">
        <h2 id="yt-guide-title">유튜버 수익, 이렇게 어림해요</h2>
        <p>
          유튜버가 실제로 얼마를 받는지는 채널 주인만 YouTube 스튜디오에서 볼 수 있어요. 그래서 돈미터는 누구나 볼 수 있는 숫자, 곧 최근 영상의 조회수와 올리는
          속도로 한 달 광고 수익의 크기를 어림해요. 최근 영상 최대 50개를 가져와 {SHORTS_MAX_SEC / 60}분 이하는 쇼츠, 나머지는 롱폼으로 나누고, 한 달 동안 새로
          생기는 조회수에 1,000회당 수익(RPM)을 곱해요.
        </p>

        <h3>예를 들어 이런 채널이라면</h3>
        <p>
          롱폼은 평균 {man(EXAMPLE.long.views)} 회씩 한 달에 {EXAMPLE.long.uploads}편, 쇼츠는 평균 {man(EXAMPLE.short.views)} 회씩 한 달에 {EXAMPLE.short.uploads}
          편 올리는 채널을 가정해 볼게요.
        </p>
        <table className="yt-guide__table">
          <caption>예시 채널의 한 달 광고 수익 (RPM 보통 기준)</caption>
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col" className="num">
                한 달 조회수
              </th>
              <th scope="col" className="num">
                1,000회당
              </th>
              <th scope="col" className="num">
                한 달 수익
              </th>
            </tr>
          </thead>
          <tbody>
            {['long', 'short'].map((k) => (
              <tr key={k}>
                <th scope="row">{k === 'long' ? '롱폼' : '쇼츠'}</th>
                <td className="num">{man(monthViews(k))} 회</td>
                <td className="num">{RPM.mid[k].toLocaleString('ko-KR')}원</td>
                <td className="num">{man(revenue('mid', k))} 원</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">합계</th>
              <td className="num">{man(monthViews('long') + monthViews('short'))} 회</td>
              <td />
              <td className="num">{man(total('mid'))} 원</td>
            </tr>
          </tfoot>
        </table>
        <p>
          한 달 {man(total('mid'))} 원이면 직장인 평균 월 소득(세전 {man(AVG.monthly)} 원)과 비슷해요. 쇼츠 조회수가 롱폼보다 {Math.round((monthViews('short') / monthViews('long')) * 10) / 10}
          배 많은데도 수익은 {Math.round(revenue('mid', 'long') / revenue('mid', 'short'))}분의 1밖에 안 된다는 점이 눈에 띄어요. 광고 단가를
          보수적으로 잡으면 {man(total('low'))} 원, 높게 잡으면 {man(total('high'))} 원이라, 같은 채널도 가정에 따라 세 배 넘게 차이 나요.
        </p>

        <h3>같은 조회수인데 수익이 다른 이유</h3>
        <ul className="yt-guide__list">
          <li>
            <strong>주제.</strong> 금융, IT, 부동산처럼 광고주가 많이 찾는 주제는 단가가 높고, 게임이나 어린이 콘텐츠는 낮은 편이에요.
          </li>
          <li>
            <strong>시청자 국가.</strong> 광고비가 비싼 나라의 시청자가 많을수록 1,000회당 수익이 올라가요.
          </li>
          <li>
            <strong>영상 길이.</strong> 8분 이상인 롱폼은 중간 광고를 넣을 수 있어서 한 번 볼 때 붙는 광고가 늘어나요.
          </li>
          <li>
            <strong>시기.</strong> 광고 예산이 몰리는 연말에는 단가가 오르고, 새해 초에는 내려가는 경우가 많아요.
          </li>
          <li>
            <strong>쇼츠.</strong> 쇼츠는 피드 사이사이 광고 수익을 한데 모아 조회수 비율로 나누고, 음악을 쓴 영상은 일부가 음원 쪽으로 가요. 그래서 1,000회당 수익이 롱폼보다 크게 낮아요.
          </li>
        </ul>

        <h3>숫자를 읽을 때 알아 둘 것</h3>
        <ul className="yt-guide__list">
          <li>최근 영상 기준이라 업로드를 쉬면 추정액도 바로 줄어요. 예전 영상에서 꾸준히 나오는 조회수는 넣지 않아서, 오래된 채널은 실제보다 적게 나올 수 있어요.</li>
          <li>협찬, 채널 멤버십, 슈퍼챗, 쇼핑 수익은 빠져 있어요. 큰 채널은 광고 밖의 수입이 광고 수익보다 많기도 해요.</li>
          <li>세금, MCN 수수료, 편집자 인건비를 빼기 전 금액이라 유튜버가 손에 쥐는 돈은 이보다 적어요.</li>
          <li>결과 화면에서 광고 단가를 보수적·보통·높게로 바꾸면 그 채널의 수익 범위를 한눈에 볼 수 있어요.</li>
        </ul>

        <h3>계산한 뒤에 해 볼 수 있는 것</h3>
        <p>
          추정 수익을 최저임금, 직장인 평균, 대기업 평균 월급과 나란히 놓아 보고, 상장사 이름을 넣으면 공시된 직원 평균 연봉으로 그 유튜버가 우리 회사 몇 년차쯤인지
          맞춰 볼 수 있어요. 내 구독자 수를 넣으면 같은 돈을 벌려면 영상을 몇 편 더 올려야 하는지도 계산해요.
        </p>

        <h3>더 읽어 보기</h3>
        <ul className="yt-guide__more">
          {READ_MORE.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.title}</a>
            </li>
          ))}
        </ul>
      </article>

      <nav className="home-links" aria-label="돈미터 안내">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>
                <strong>{l.title}</strong>
                <span>{l.desc}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="home-links__note">모든 금액은 YouTube 공개 데이터로 계산한 재미용 추정치예요.</p>
      </nav>
    </>
  )
}
