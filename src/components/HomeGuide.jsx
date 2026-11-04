// 첫 화면 아래의 짧은 안내: 자세한 설명은 각 페이지로 나눴다.
const LINKS = [
  { href: '/how/', title: '계산 방법', desc: '숫자가 어떻게 나오는지 세 단계로 설명해요.' },
  { href: '/faq/', title: '자주 묻는 질문', desc: '실제 수익인가요? 협찬도 들어가나요?' },
  { href: '/guide/', title: '수익 가이드', desc: 'RPM, 쇼츠 수익, 수익 창출 조건을 정리했어요.' },
]

export default function HomeGuide() {
  return (
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
  )
}
