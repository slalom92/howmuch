// 결과 아래 안내 카드: 계산 결과가 어림값이라는 것과 기준을 어디서 보는지 알려 준다.
export default function ResultNote({ title = '계산 결과는 어림값이에요', children }) {
  return (
    <aside className="result-note">
      <span className="result-note__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
      </span>
      <div>
        <p className="result-note__title">{title}</p>
        <p className="result-note__text">{children}</p>
      </div>
    </aside>
  )
}
