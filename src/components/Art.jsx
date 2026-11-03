// 사이트 전체에서 쓰는 SVG 그래픽
// 색은 styles.css 의 변수와 같은 값을 쓴다 (ink #1a2238, seal #c2362b, rule #cfd6e0, tint #f4f6f9)

const INK = '#1a2238'
const SEAL = '#c2362b'
const RULE = '#cfd6e0'
const TINT = '#f4f6f9'
const BILL = '#e3e9f0'
const BILL_LINE = '#8f9ab0'

// 브랜드 마크: 원 도장 안의 ₩
export function BrandMark({ size = 22 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke={SEAL} strokeWidth="2.4" />
      <path d="M7.2 8.2l1.9 7.6 1.9-6.2 1.9 6.2 1.9-7.6M6.6 11.2h10.8M6.6 13.2h10.8" fill="none" stroke={SEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// 지폐 한 장 (월급봉투 그림에 쓰는 부품)
function Bill({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x="0" y="0" width="190" height="96" rx="6" fill={BILL} stroke={BILL_LINE} strokeWidth="2" />
      <rect x="9" y="9" width="172" height="78" rx="3" fill="none" stroke={BILL_LINE} strokeWidth="1.2" strokeDasharray="2 3" />
      <circle cx="140" cy="48" r="24" fill="#fff" stroke={BILL_LINE} strokeWidth="1.6" />
      <text x="140" y="56" textAnchor="middle" fontSize="24" fontWeight="700" fill={BILL_LINE}>₩</text>
      <path d="M24 30h62M24 42h46M24 54h54" stroke={BILL_LINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 72c10-8 20 8 30 0s20 8 30 0" fill="none" stroke={BILL_LINE} strokeWidth="1.4" />
    </g>
  )
}

function Coin({ x, y, r = 22 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#fff" stroke={INK} strokeWidth="2.4" />
      <circle r={r - 5} fill="none" stroke={RULE} strokeWidth="1.4" />
      <text y={r * 0.33} textAnchor="middle" fontSize={r * 0.95} fontWeight="700" fill={INK}>
        ₩
      </text>
    </g>
  )
}

// 첫 화면 일러스트: 지폐가 비어져 나온 월급봉투
export function PayEnvelope({ className }) {
  return (
    <svg className={className} viewBox="0 0 360 280" role="img" aria-label="지폐가 든 월급봉투 그림">
      <ellipse cx="180" cy="262" rx="140" ry="10" fill={INK} opacity="0.08" />
      {/* 봉투 뒷면과 열린 덮개 */}
      <rect x="44" y="104" width="272" height="146" rx="6" fill={TINT} stroke={INK} strokeWidth="2.5" />
      <path d="M44 110 L180 34 L316 110" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 지폐 */}
      <Bill x={70} y={58} r={-9} />
      <Bill x={104} y={44} r={6} />
      {/* 봉투 앞주머니 */}
      <path d="M44 132 L180 196 L316 132 V244 a6 6 0 0 1 -6 6 H50 a6 6 0 0 1 -6 -6 Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 244 L150 182 M316 244 L210 182" stroke={RULE} strokeWidth="2" />
      <text x="84" y="236" fontSize="22" fontWeight="700" fill={INK} letterSpacing="6">
        급여
      </text>
      <path d="M150 230h40" stroke={RULE} strokeWidth="2" />
      {/* 도장 */}
      <g transform="translate(262 206) rotate(-14)">
        <circle r="30" fill="none" stroke={SEAL} strokeWidth="3.5" opacity="0.92" />
        <circle r="24" fill="none" stroke={SEAL} strokeWidth="1.2" opacity="0.8" />
        <text y="7" textAnchor="middle" fontSize="18" fontWeight="800" fill={SEAL} letterSpacing="1">
          추정
        </text>
      </g>
      <Coin x={322} y={70} r={20} />
      <Coin x={30} y={92} r={15} />
      <path d="M300 30l6 6M318 22l-2 9M286 44l-8 2" stroke={SEAL} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

// 지폐 바탕의 겹친 물결 무늬(길로셰). 장식이라 스크린리더에서 숨긴다.
function rosette(cx, cy, R, amp, k, phase, steps = 360) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const r = R + amp * Math.sin(k * t + phase)
    const x = cx + r * Math.cos(t)
    const y = cy + r * Math.sin(t)
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d + 'Z'
}

const GUILLOCHE = Array.from({ length: 9 }, (_, i) => rosette(120, 120, 64 + i * 5, 14, 12, (i * Math.PI) / 9))

export function Guilloche({ className, color = SEAL }) {
  return (
    <svg className={className} viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      {GUILLOCHE.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="0.7" />
      ))}
    </svg>
  )
}

// 비교 그래프 아이콘 (24×24, 선 아이콘)
const icon = (children) =>
  function Icon() {
    return (
      <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    )
  }

// 영상 크리에이터: 캠코더 (특정 서비스 로고와 닮지 않게 일반 기호로)
export const IconVideo = icon(
  <>
    <rect x="2.5" y="7" width="13" height="10" rx="2" />
    <path d="M15.5 10.5l5-3v9l-5-3" />
    <circle cx="6.5" cy="5" r="1.6" />
  </>,
)
export const IconClock = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
)
export const IconShop = icon(
  <>
    <path d="M4 10h16v10H4z" />
    <path d="M3 10l2-5h14l2 5" />
    <path d="M10 20v-5h4v5" />
  </>,
)
export const IconPerson = icon(
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" />
  </>,
)
export const IconTower = icon(
  <>
    <path d="M6 21V4h9v17M15 9h4v12" />
    <path d="M9 8h3M9 12h3M9 16h3M4 21h17" />
  </>,
)

export function Scissors() {
  return (
    <svg className="scissors" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="7" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="M8.5 8.5L20 18M8.5 15.5L20 6" />
    </svg>
  )
}
