import { POPULAR, channelPath } from '../lib/popular.js'

// 많이 찾는 유튜버 바로가기. 링크마다 채널 페이지(/channel/<핸들>/)가 열려 검색엔진도 따라갈 수 있다.
export default function PopularChannels({ currentSlug, title, limit = 14 }) {
  const list = POPULAR.filter((p) => p.slug !== currentSlug).slice(0, limit)
  return (
    <nav className="popular" aria-labelledby="popular-title">
      <h2 className="popular__title" id="popular-title">
        {title}
      </h2>
      <ul className="popular__list">
        {list.map((p) => (
          <li key={p.slug}>
            <a className="popular__chip" href={channelPath(p.slug)}>
              {p.name}
            </a>
          </li>
        ))}
      </ul>
      <a className="popular__all" href="/channel/">
        유튜버별 수익 전체 보기
      </a>
    </nav>
  )
}
