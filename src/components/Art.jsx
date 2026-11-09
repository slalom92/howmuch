// 사이트 전체에서 쓰는 SVG 그래픽
// 색은 테마 변수(public/themes.css)를 따른다. Safari 호환을 위해 SVG 속성 대신 style 로 칠한다.

const INK = 'var(--ink)'
const SEAL = 'var(--seal)'
const RULE = 'var(--rule)'
const TINT = 'var(--paper-tint)'
const BILL = 'var(--desk)'
const BILL_LINE = 'var(--bar)'

// 돈미터 로고: 파비콘(public/favicon.svg)과 같은 계기판 그림. 테마와 상관없이 같은 색을 쓰고,
// 어두운 테마에서도 네모가 보이게 가장자리에 옅은 흰 테두리를 둔다.
export function BrandMark({ size = 22 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="62" height="62" rx="13" fill="#111827" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
      <g fill="none" strokeWidth="8">
        <path d="M12 42 A20 20 0 0 1 21.6 24.9" stroke="#22C55E" />
        <path d="M23.4 23.9 A20 20 0 0 1 40.6 23.9" stroke="#FACC15" />
        <path d="M42.4 24.9 A20 20 0 0 1 52 42" stroke="#EF4444" />
      </g>
      <line x1="32" y1="42" x2="47" y2="33.5" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="42" r="5.5" fill="#fff" />
    </svg>
  )
}

// 지폐 한 장 (월급봉투 그림에 쓰는 부품)
function Bill({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x="0" y="0" width="190" height="96" rx="6" strokeWidth="2" style={{ fill: BILL, stroke: BILL_LINE }} />
      <rect x="9" y="9" width="172" height="78" rx="3" fill="none" strokeWidth="1.2" strokeDasharray="2 3" style={{ stroke: BILL_LINE }} />
      <circle cx="140" cy="48" r="24" strokeWidth="1.6" style={{ fill: 'var(--paper)', stroke: BILL_LINE }} />
      <text x="140" y="56" textAnchor="middle" fontSize="24" fontWeight="700" style={{ fill: BILL_LINE }}>₩</text>
      <path d="M24 30h62M24 42h46M24 54h54" strokeWidth="3" strokeLinecap="round" style={{ stroke: BILL_LINE }} />
      <path d="M24 72c10-8 20 8 30 0s20 8 30 0" fill="none" strokeWidth="1.4" style={{ stroke: BILL_LINE }} />
    </g>
  )
}

function Coin({ x, y, r = 22 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} strokeWidth="2.4" style={{ fill: 'var(--paper)', stroke: INK }} />
      <circle r={r - 5} fill="none" strokeWidth="1.4" style={{ stroke: RULE }} />
      <text y={r * 0.33} textAnchor="middle" fontSize={r * 0.95} fontWeight="700" style={{ fill: INK }}>
        ₩
      </text>
    </g>
  )
}

// 첫 화면 일러스트: 지폐가 비어져 나온 월급봉투
export function PayEnvelope({ className }) {
  return (
    <svg className={className} viewBox="0 0 360 280" role="img" aria-label="지폐가 든 월급봉투 그림">
      <ellipse cx="180" cy="262" rx="140" ry="10" opacity="0.08" style={{ fill: INK }} />
      {/* 봉투 뒷면과 열린 덮개 */}
      <rect x="44" y="104" width="272" height="146" rx="6" strokeWidth="2.5" style={{ fill: TINT, stroke: INK }} />
      <path d="M44 110 L180 34 L316 110" strokeWidth="2.5" strokeLinejoin="round" style={{ fill: 'var(--paper)', stroke: INK }} />
      {/* 지폐 */}
      <Bill x={70} y={58} r={-9} />
      <Bill x={104} y={44} r={6} />
      {/* 봉투 앞주머니 */}
      <path d="M44 132 L180 196 L316 132 V244 a6 6 0 0 1 -6 6 H50 a6 6 0 0 1 -6 -6 Z" strokeWidth="2.5" strokeLinejoin="round" style={{ fill: 'var(--paper)', stroke: INK }} />
      <path d="M44 244 L150 182 M316 244 L210 182" strokeWidth="2" style={{ stroke: RULE }} />
      <text x="84" y="236" fontSize="22" fontWeight="700" letterSpacing="6" style={{ fill: INK }}>
        급여
      </text>
      <path d="M150 230h40" strokeWidth="2" style={{ stroke: RULE }} />
      {/* 도장 */}
      <g transform="translate(262 206) rotate(-14)">
        <circle r="30" fill="none" strokeWidth="3.5" opacity="0.92" style={{ stroke: SEAL }} />
        <circle r="24" fill="none" strokeWidth="1.2" opacity="0.8" style={{ stroke: SEAL }} />
        <text y="7" textAnchor="middle" fontSize="18" fontWeight="800" letterSpacing="1" style={{ fill: SEAL }}>
          추정
        </text>
      </g>
      <Coin x={322} y={70} r={20} />
      <Coin x={30} y={92} r={15} />
      <path d="M300 30l6 6M318 22l-2 9M286 44l-8 2" strokeWidth="2.4" strokeLinecap="round" style={{ stroke: SEAL }} />
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
        <path key={i} d={d} fill="none" strokeWidth="0.7" style={{ stroke: color }} />
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
