// 맨 위 큰 배너: 유튜브 썸네일처럼 큰 숫자 하나 + 알약 모양 한 줄 (예: "285년" / "내 월급으로 한남더힐")
// big, cap 은 페이지 폴더의 sting.js 가 계산 결과로 만든다. 숫자가 바뀌면 한 번 튀어 오른다.
export default function StingHero({ big, cap, label }) {
  if (!big) return null
  const long = cap.length > 13
  // 큰 숫자가 길면 한 줄에 들어가도록 줄인다
  const size = big.length > 7 ? ' is-xs' : big.length > 5 ? ' is-sm' : ''
  return (
    <div className="sting-hero" role="img" aria-label={label || `${big}, ${cap}`}>
      <svg className="sting-hero__rays" viewBox="0 0 400 200" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2
          const r1 = 96 + (i % 3) * 8
          const r2 = 150 + (i % 2) * 34
          const x = (r) => (200 + Math.cos(a) * r * 1.5).toFixed(1)
          const y = (r) => (96 + Math.sin(a) * r * 0.62).toFixed(1)
          return <line key={i} x1={x(r1)} y1={y(r1)} x2={x(r2)} y2={y(r2)} />
        })}
      </svg>
      <svg className="sting-hero__spark sting-hero__spark--l" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" />
      </svg>
      <svg className="sting-hero__spark sting-hero__spark--r" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" />
      </svg>
      <p className={`sting-hero__big${size}`} key={big} aria-hidden="true">
        {big}
      </p>
      <p className={`sting-hero__cap${long ? ' is-long' : ''}`} aria-hidden="true">
        {cap}
      </p>
    </div>
  )
}
