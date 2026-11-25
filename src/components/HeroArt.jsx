// 페이지 맨 위 오른쪽 그림 (SVG). 분홍 원 바탕에 계산기·동전·주제 소품을 겹쳐 놓는다.
// 색은 테마와 상관없이 고정이다 (그림이므로). 장식이라 화면 읽기 프로그램에는 숨긴다.
// kind: home | apt | car | youtuber | survive | jonber | commute | gift | subscription | kbo | golf

const C = {
  coral: '#f26b4f',
  coralDark: '#dc5034',
  coralLight: '#ff9b83',
  cream: '#fff8f3',
  blush: '#ffe2d9',
  gold: '#f8c443',
  goldDark: '#e09d1c',
  goldLight: '#ffe38f',
  steel: '#2c3446',
  sky: '#a9c2dc',
  white: '#ffffff',
  shade: '#e9edf3',
  leaf: '#7cc36e',
  leafDark: '#4f9c48',
}

function Defs({ id }) {
  return (
    <defs>
      <radialGradient id={`${id}-bg`} cx="50%" cy="45%" r="60%">
        <stop offset="0" stopColor="#ffe3da" />
        <stop offset="1" stopColor="#ffe3da" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-coral`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.coralLight} />
        <stop offset="1" stopColor={C.coral} />
      </linearGradient>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.goldDark} />
        <stop offset="0.45" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDark} />
      </linearGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.white} />
        <stop offset="1" stopColor="#f3eee9" />
      </linearGradient>
    </defs>
  )
}

const Shadow = ({ cx, cy, rx, ry = 6 }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#28344e" opacity="0.09" />

// 동전 더미: (x, y)는 맨 아래 동전의 가운데
function Coins({ id, x, y, n = 4, r = 22 }) {
  const h = 7
  const items = []
  for (let i = 0; i < n; i++) {
    const cy = y - i * h
    items.push(
      <g key={i}>
        <path d={`M${x - r} ${cy} v${-h + 2} a${r} ${r * 0.38} 0 0 0 ${r * 2} 0 v${h - 2} a${r} ${r * 0.38} 0 0 1 ${-r * 2} 0z`} fill={`url(#${id}-gold)`} />
        <ellipse cx={x} cy={cy - h + 2} rx={r} ry={r * 0.38} fill={C.gold} stroke={C.goldDark} strokeWidth="1" />
      </g>,
    )
  }
  const top = y - (n - 1) * h - h + 2
  return (
    <g>
      <Shadow cx={x} cy={y + 4} rx={r + 6} />
      {items}
      <ellipse cx={x} cy={top} rx={r * 0.62} ry={r * 0.22} fill="none" stroke={C.goldLight} strokeWidth="2" />
    </g>
  )
}

function Calculator({ id, x, y, w = 108, tilt = 8 }) {
  const h = w * 1.3
  const bw = (w - 34) / 4
  const keys = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      keys.push(
        <rect
          key={`${r}-${c}`}
          x={14 + c * (bw + 2)}
          y={58 + r * (bw * 0.78 + 4)}
          width={bw - 2}
          height={bw * 0.78}
          rx="4"
          fill={c === 3 ? C.coralLight : r === 0 ? C.blush : C.cream}
        />,
      )
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <Shadow cx={w / 2 + 6} cy={h + 6} rx={w * 0.55} ry={8} />
      <rect x="4" y="6" width={w} height={h} rx="16" fill={C.coralDark} />
      <rect width={w} height={h} rx="16" fill={`url(#${id}-coral)`} />
      <rect x="12" y="12" width={w - 24} height="36" rx="8" fill={C.cream} />
      <rect x="20" y="22" width={(w - 24) * 0.45} height="6" rx="3" fill={C.blush} />
      {keys}
    </g>
  )
}

function House({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow cx="60" cy="96" rx="68" ry="8" />
      <rect x="10" y="42" width="100" height="54" rx="4" fill={C.cream} />
      <rect x="10" y="86" width="100" height="10" rx="3" fill="#f1e2d8" />
      <rect x="78" y="6" width="12" height="26" rx="2" fill={C.coralDark} />
      <path d="M0 48 L60 4 L120 48 L112 54 L60 16 L8 54 Z" fill={C.coral} />
      <path d="M8 54 L60 16 L112 54 L112 46 L60 8 L8 46Z" fill={C.coralLight} opacity="0.55" />
      <rect x="50" y="60" width="20" height="36" rx="3" fill={C.coralDark} />
      <circle cx="65" cy="79" r="1.8" fill={C.gold} />
      {[22, 82].map((wx) => (
        <g key={wx}>
          <rect x={wx} y="58" width="18" height="16" rx="2" fill={C.sky} stroke={C.white} strokeWidth="2.5" />
          <path d={`M${wx + 9} 58 v16 M${wx} 66 h18`} stroke={C.white} strokeWidth="1.6" />
        </g>
      ))}
    </g>
  )
}

function Car({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow cx="80" cy="70" rx="84" ry="8" />
      <path d="M8 52 C8 40 16 34 30 32 L48 14 C52 10 58 8 66 8 L104 8 C112 8 118 11 124 17 L140 32 C152 34 160 40 160 52 L160 58 C160 62 157 64 153 64 L14 64 C10 64 8 62 8 58Z" fill={C.white} />
      <path d="M8 52 L160 52 L160 58 C160 62 157 64 153 64 L14 64 C10 64 8 62 8 58Z" fill={C.shade} />
      <path d="M54 16 C57 13 61 12 66 12 L80 12 L80 32 L38 32Z" fill={C.sky} />
      <path d="M86 12 L103 12 C108 12 112 14 116 18 L130 32 L86 32Z" fill={C.sky} />
      <rect x="146" y="38" width="12" height="6" rx="3" fill={C.goldLight} />
      <rect x="10" y="40" width="10" height="6" rx="3" fill={C.coralLight} />
      {[38, 128].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy="62" r="15" fill={C.steel} />
          <circle cx={wx} cy="62" r="7" fill="#c8cfda" />
        </g>
      ))}
    </g>
  )
}

function Board({ id, x, y, w = 92 }) {
  const h = w * 0.86
  return (
    <g transform={`translate(${x} ${y}) rotate(-4)`}>
      <Shadow cx={w / 2} cy={h + 6} rx={w * 0.5} />
      <rect width={w} height={h} rx="10" fill={`url(#${id}-paper)`} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={14 + i * 18} y={h - 14 - (i + 1) * 11} width="11" height={(i + 1) * 11} rx="2" fill={C.blush} />
      ))}
      <path d={`M12 ${h - 22} L32 ${h - 34} L48 ${h - 30} L74 ${h - 58}`} fill="none" stroke={C.coral} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M64 ${h - 60} L77 ${h - 61} L75 ${h - 48}`} fill="none" stroke={C.coral} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Calendar({ x, y, w = 96, mark = '₩' }) {
  const h = w * 0.95
  return (
    <g transform={`translate(${x} ${y}) rotate(-6)`}>
      <Shadow cx={w / 2} cy={h + 6} rx={w * 0.52} />
      <rect width={w} height={h} rx="12" fill={C.white} />
      <path d={`M0 12 a12 12 0 0 1 12 -12 h${w - 24} a12 12 0 0 1 12 12 v14 h${-w}z`} fill={C.coral} />
      {[0.28, 0.72].map((p) => (
        <rect key={p} x={w * p - 4} y="-8" width="8" height="18" rx="4" fill={C.steel} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={12 + (i % 4) * ((w - 24) / 4)} y={36 + Math.floor(i / 4) * 16} width={(w - 24) / 4 - 6} height="10" rx="2" fill={i === 6 ? C.coralLight : C.shade} />
      ))}
      <circle cx={w - 4} cy={h - 6} r="16" fill={C.gold} stroke={C.goldDark} strokeWidth="2" />
      <text x={w - 4} y={h - 1} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.goldDark}>
        {mark}
      </text>
    </g>
  )
}

function Tree({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="10" width="6" height="26" rx="3" fill="#a87a55" />
      <circle cx="0" cy="0" r="18" fill={C.leaf} />
      <circle cx="-8" cy="-6" r="8" fill="#9bd68d" opacity="0.7" />
      <circle cx="9" cy="8" r="10" fill={C.leafDark} opacity="0.5" />
    </g>
  )
}

function Screen({ x, y, w = 132 }) {
  const h = w * 0.66
  return (
    <g transform={`translate(${x} ${y})`}>
      <Shadow cx={w / 2} cy={h + 22} rx={w * 0.45} />
      <rect x={w / 2 - 8} y={h} width="16" height="14" fill="#c9d0db" />
      <rect x={w / 2 - 28} y={h + 12} width="56" height="8" rx="4" fill="#c9d0db" />
      <rect width={w} height={h} rx="12" fill={C.steel} />
      <rect x="7" y="7" width={w - 14} height={h - 14} rx="7" fill={C.white} />
      <rect x={w / 2 - 26} y={h / 2 - 18} width="52" height="36" rx="11" fill={C.coral} />
      <path d={`M${w / 2 - 7} ${h / 2 - 10} L${w / 2 + 11} ${h / 2} L${w / 2 - 7} ${h / 2 + 10}Z`} fill={C.white} />
    </g>
  )
}

function Train({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Shadow cx="50" cy="128" rx="58" />
      <rect x="6" y="0" width="88" height="118" rx="24" fill={C.white} />
      <rect x="6" y="70" width="88" height="14" fill={C.coral} />
      <rect x="18" y="14" width="64" height="44" rx="10" fill={C.sky} />
      <path d="M50 14 v44" stroke={C.white} strokeWidth="3" />
      <circle cx="26" cy="98" r="7" fill={C.goldLight} />
      <circle cx="74" cy="98" r="7" fill={C.goldLight} />
      <path d="M22 118 L10 132 M78 118 L90 132" stroke={C.steel} strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

function Pin({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow cx="0" cy="44" rx="14" ry="4" />
      <path d="M0 44 C-6 30 -24 18 -24 0 a24 24 0 0 1 48 0 C24 18 6 30 0 44Z" fill={C.coral} />
      <circle cx="0" cy="0" r="9" fill={C.white} />
    </g>
  )
}

function Ball({ x, y, r = 40 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Shadow cx="0" cy={r + 6} rx={r * 0.9} />
      <circle r={r} fill={C.white} />
      <circle r={r} fill="none" stroke={C.shade} strokeWidth="3" />
      <path d={`M${-r * 0.55} ${-r * 0.82} C${-r * 0.2} ${-r * 0.3} ${-r * 0.2} ${r * 0.3} ${-r * 0.55} ${r * 0.82}`} fill="none" stroke={C.coral} strokeWidth="3" strokeDasharray="5 4" />
      <path d={`M${r * 0.55} ${-r * 0.82} C${r * 0.2} ${-r * 0.3} ${r * 0.2} ${r * 0.3} ${r * 0.55} ${r * 0.82}`} fill="none" stroke={C.coral} strokeWidth="3" strokeDasharray="5 4" />
    </g>
  )
}

function Bat({ x, y }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(38)`}>
      <path d="M-6 0 L6 0 L12 -110 C12 -118 -12 -118 -12 -110Z" fill="#d9a26a" />
      <rect x="-8" y="-4" width="16" height="10" rx="4" fill={C.steel} />
    </g>
  )
}

function Flag({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx="78" ry="20" fill={C.leaf} />
      <ellipse cx="0" cy="-3" rx="70" ry="15" fill="#9bd68d" />
      <ellipse cx="14" cy="-2" rx="9" ry="3.5" fill={C.steel} />
      <rect x="12" y="-112" width="4" height="110" rx="2" fill="#c9d0db" />
      <path d="M16 -110 L62 -96 L16 -80Z" fill={C.coral} />
      <circle cx="-30" cy="-6" r="8" fill={C.white} stroke={C.shade} strokeWidth="1.5" />
    </g>
  )
}

function Envelope({ x, y, w = 132 }) {
  const h = w * 0.66
  return (
    <g transform={`translate(${x} ${y}) rotate(-5)`}>
      <Shadow cx={w / 2} cy={h + 6} rx={w * 0.5} />
      <rect width={w} height={h} rx="10" fill={C.cream} />
      <path d={`M4 6 L${w / 2} ${h * 0.58} L${w - 4} 6`} fill="none" stroke={C.blush} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M4 ${h - 4} L${w * 0.4} ${h * 0.5} M${w - 4} ${h - 4} L${w * 0.6} ${h * 0.5}`} stroke={C.blush} strokeWidth="3" />
      <path d={`M${w / 2} ${h * 0.7} c-14 -10 -16 -22 -7 -26 c4 -2 7 0 7 4 c0 -4 3 -6 7 -4 c9 4 7 16 -7 26z`} fill={C.coral} />
    </g>
  )
}

function Card({ id, x, y, w = 140 }) {
  const h = w * 0.62
  return (
    <g transform={`translate(${x} ${y}) rotate(-8)`}>
      <Shadow cx={w / 2} cy={h + 8} rx={w * 0.48} />
      <rect width={w} height={h} rx="12" fill={`url(#${id}-coral)`} />
      <rect y="20" width={w} height="14" fill={C.coralDark} opacity="0.5" />
      <rect x="16" y="44" width="26" height="20" rx="4" fill={C.gold} />
      <rect x="16" y={h - 20} width={w * 0.5} height="6" rx="3" fill={C.cream} opacity="0.85" />
    </g>
  )
}

function Cycle({ x, y, r = 22 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 8} fill={C.white} />
      <path d={`M${-r * 0.8} ${-r * 0.2} A${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.6} ${-r * 0.55}`} fill="none" stroke={C.coral} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${r * 0.8} ${r * 0.2} A${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.6} ${r * 0.55}`} fill="none" stroke={C.coral} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${r * 0.3} ${-r * 0.85} L${r * 0.68} ${-r * 0.55} L${r * 0.3} ${-r * 0.22}`} fill="none" stroke={C.coral} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${-r * 0.3} ${r * 0.85} L${-r * 0.68} ${r * 0.55} L${-r * 0.3} ${r * 0.22}`} fill="none" stroke={C.coral} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Wallet({ x, y, w = 128 }) {
  const h = w * 0.7
  return (
    <g transform={`translate(${x} ${y}) rotate(-4)`}>
      <Shadow cx={w / 2} cy={h + 6} rx={w * 0.5} />
      <rect x="10" y="-14" width={w - 30} height="40" rx="6" fill="#7fc79a" transform="rotate(-6)" />
      <rect width={w} height={h} rx="16" fill={C.coral} />
      <rect y="0" width={w} height="22" rx="11" fill={C.coralLight} opacity="0.6" />
      <rect x={w - 44} y={h / 2 - 14} width="48" height="28" rx="10" fill={C.coralDark} />
      <circle cx={w - 22} cy={h / 2} r="6" fill={C.gold} />
    </g>
  )
}

function Stopwatch({ x, y, r = 46 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Shadow cx="0" cy={r + 8} rx={r * 0.9} />
      <rect x="-9" y={-r - 18} width="18" height="14" rx="4" fill={C.coralDark} />
      <circle r={r} fill={C.coral} />
      <circle r={r - 9} fill={C.white} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <circle key={i} cx={Math.cos(a) * (r - 17)} cy={Math.sin(a) * (r - 17)} r="2" fill={C.shade} />
      })}
      <path d={`M0 0 L0 ${-(r - 20)} M0 0 L${r * 0.36} ${r * 0.14}`} stroke={C.steel} strokeWidth="4" strokeLinecap="round" />
      <circle r="5" fill={C.coral} />
    </g>
  )
}

function Sparks({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={C.coral} strokeWidth="3" strokeLinecap="round">
      <path d="M0 10 L8 0 M6 16 L18 10 M-4 -2 L-2 -12" />
    </g>
  )
}

const SCENES = {
  home: (id) => (
    <>
      <Board id={id} x={138} y={22} w={100} />
      <House x={70} y={104} s={0.5} />
      <Coins id={id} x={52} y={190} n={5} />
      <Car x={104} y={138} s={0.68} />
      <Calculator id={id} x={234} y={50} w={98} />
      <Coins id={id} x={300} y={200} n={3} r={20} />
      <Sparks x={320} y={40} />
    </>
  ),
  apt: (id) => (
    <>
      <Coins id={id} x={70} y={182} n={5} />
      <House x={98} y={70} s={1.05} />
      <Tree x={232} y={140} s={0.9} />
      <Calculator id={id} x={252} y={58} w={88} />
      <Coins id={id} x={244} y={198} n={2} r={18} />
    </>
  ),
  car: (id) => (
    <>
      <Calendar x={232} y={34} w={84} mark="✓" />
      <Coins id={id} x={62} y={186} n={4} />
      <Car x={86} y={104} s={1.08} />
      <Coins id={id} x={300} y={192} n={3} r={18} />
      <Sparks x={326} y={30} />
    </>
  ),
  youtuber: (id) => (
    <>
      <Screen x={96} y={42} w={140} />
      <Coins id={id} x={70} y={190} n={4} />
      <Board id={id} x={246} y={96} w={76} />
      <Sparks x={318} y={70} />
    </>
  ),
  survive: (id) => (
    <>
      <Calendar x={212} y={40} w={96} />
      <Wallet x={86} y={90} w={126} />
      <Coins id={id} x={64} y={196} n={3} />
      <Coins id={id} x={300} y={196} n={4} r={18} />
    </>
  ),
  jonber: (id) => (
    <>
      <Stopwatch x={150} y={110} r={56} />
      <Calendar x={232} y={64} w={80} />
      <Coins id={id} x={66} y={188} n={5} />
      <Sparks x={210} y={22} />
    </>
  ),
  commute: (id) => (
    <>
      <House x={210} y={100} s={0.7} />
      <Train x={96} y={52} />
      <Pin x={262} y={60} s={0.9} />
      <Coins id={id} x={60} y={194} n={3} />
    </>
  ),
  gift: (id) => (
    <>
      <Envelope x={110} y={66} w={140} />
      <Coins id={id} x={70} y={190} n={4} />
      <Coins id={id} x={296} y={192} n={3} r={18} />
      <Sparks x={276} y={42} />
    </>
  ),
  subscription: (id) => (
    <>
      <Calendar x={218} y={40} w={88} />
      <Card id={id} x={92} y={92} w={140} />
      <Cycle x={236} y={150} />
      <Coins id={id} x={64} y={192} n={4} />
    </>
  ),
  kbo: (id) => (
    <>
      <Bat x={250} y={190} />
      <Ball x={176} y={112} r={52} />
      <Coins id={id} x={78} y={186} n={5} />
      <Coins id={id} x={292} y={198} n={2} r={18} />
    </>
  ),
  golf: (id) => (
    <>
      <Flag x={180} y={170} />
      <Coins id={id} x={70} y={188} n={4} />
      <Coins id={id} x={298} y={194} n={3} r={18} />
      <Sparks x={250} y={40} />
    </>
  ),
}

export default function HeroArt({ kind = 'home', className = '' }) {
  const scene = SCENES[kind] || SCENES.home
  const id = `ha-${kind}`
  return (
    <svg className={`hero-art ${className}`} viewBox="0 0 360 230" aria-hidden="true" focusable="false">
      <Defs id={id} />
      <circle cx="186" cy="112" r="108" fill={`url(#${id}-bg)`} />
      {scene(id)}
    </svg>
  )
}
