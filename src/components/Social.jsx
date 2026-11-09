// 돈미터 공식 SNS 바로가기 (푸터에 둔다). 정적 페이지(index.html, public/**)에도 같은 마크업이 들어 있다.
export const INSTAGRAM = 'https://www.instagram.com/donmeter.official'

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="dot" cx="17.3" cy="6.7" r="1.1" />
    </svg>
  )
}

export default function SocialLinks() {
  return (
    <div className="social">
      <a className="social__btn" href={INSTAGRAM} target="_blank" rel="noopener" aria-label="돈미터 인스타그램 (새 창)" title="돈미터 인스타그램">
        <InstagramIcon />
      </a>
    </div>
  )
}
