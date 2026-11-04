import { channelUrl } from './PayStub.jsx'

// 가상 사원증: "우리 회사에 다닌다면?" 결과를 목걸이 사원증 모양으로 보여 준다.
// - 회사 로고는 쓰지 않는다 (상표·사칭 문제). 회사 이름은 글자로만, 엠블럼은 회사 이름 첫 글자로 만든 일반 도형.
// - 유튜버 사진은 YouTube 채널 프로필 이미지를 변형 없이 넣고, 누르면 채널로 이동한다.
// - "가상 사원증" 워터마크와 안내 문구로 실제 신분증처럼 보이지 않게 한다.

// 직급(급)과 직책(맡은 자리)
function roleOf(place) {
  switch (place.kind) {
    case 'below':
      return { grade: '인턴', title: '수습사원', years: '수습 기간' }
    case 'staff': {
      const titles = ['팀원', '팀원', '파트장', '팀장', '부서장']
      return { grade: place.rank, title: titles[place.rankIndex] || '팀원', years: `${place.rank} ${place.yearInRank}년차 · 경력 ${place.totalYear}년차` }
    }
    case 'preexec':
      return { grade: '수석부장', title: '실장', years: place.sub.replace('입사', '경력') }
    case 'exec':
      return { grade: '상무', title: '본부장', years: '임원' }
    case 'board':
      return /배$/.test(place.text) && parseFloat(place.text.replace(/[^\d.]/g, '')) >= 3
        ? { grade: '사장', title: '대표이사', years: '등기임원' }
        : { grade: '전무', title: '사업부장', years: '등기임원' }
    default:
      return { grade: '부장', title: '부서장', years: (place.sub || '').replace('입사', '경력') }
  }
}

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 받침이 있으면 '과', 없으면 '와' (한글이 아니면 '와(과)')
function waGwa(word) {
  const last = [...word.replace(/[\s)\]]+$/, '')].pop() || ''
  if (last < '가' || last > '힣') return `${word}와(과)`
  return word + ((last.charCodeAt(0) - 0xac00) % 28 ? '과' : '와')
}

const ymd = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 채널 ID로 만든 장식용 바코드
function Barcode({ seed }) {
  let h = hash(seed)
  const bars = []
  let x = 0
  for (let i = 0; x < 150; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
    const w = 1 + (h % 3)
    const gap = 1 + ((h >>> 4) % 3)
    bars.push(<rect key={i} x={x} y="0" width={w} height="28" style={{ fill: 'var(--ink)' }} />)
    x += w + gap
  }
  return (
    <svg className="badge__barcode" viewBox="0 0 150 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {bars}
    </svg>
  )
}

export default function EmployeeBadge({ channel, company, place }) {
  const companyName = company.stockName || company.name
  const initial = [...companyName.replace(/^\(주\)|㈜|주식회사\s*/g, '').trim()][0] || '?'
  const role = roleOf(place)
  const no = String(hash(channel.id) % 1000000).padStart(6, '0')
  const year = channel.createdAt ? String(new Date(channel.createdAt).getFullYear()).slice(2) : '00'
  const empNo = `YT${year}-${no}`

  return (
    <figure className="badge-wrap" aria-label={`${companyName} 가상 사원증. ${channel.title}, ${role.grade}, ${role.title}.`}>
      {/* 목걸이 줄과 집게 */}
      <svg className="badge__lanyard" viewBox="0 0 120 70" aria-hidden="true" focusable="false">
        <path d="M14 0 L52 52 M106 0 L68 52" strokeWidth="12" strokeLinecap="round" style={{ stroke: 'var(--seal)' }} />
        <rect x="46" y="44" width="28" height="22" rx="5" strokeWidth="2.5" style={{ fill: 'var(--paper-tint)', stroke: 'var(--ink)' }} />
        <rect x="54" y="58" width="12" height="12" rx="2" style={{ fill: 'var(--ink)' }} />
      </svg>

      <div className="badge">
        <div className="badge__hole" aria-hidden="true" />
        <div className="badge__watermark" aria-hidden="true">
          가상 사원증 가상 사원증 가상 사원증 가상 사원증 가상 사원증 가상 사원증
        </div>

        <header className="badge__head">
          <span className="badge__emblem" aria-hidden="true">
            {initial}
          </span>
          <span className="badge__org">{companyName}</span>
          <span className="badge__kind">가상 사원증</span>
        </header>

        <a className="badge__photo" href={channelUrl(channel)} target="_blank" rel="noopener noreferrer" title={`${channel.title} YouTube 채널 (새 창)`}>
          {channel.thumbnail ? (
            <img src={channel.thumbnail} alt={`${channel.title} 채널 프로필 사진`} referrerPolicy="no-referrer" />
          ) : (
            <span className="badge__initial">{[...channel.title][0]}</span>
          )}
        </a>
        <p className="badge__credit">사진 · YouTube</p>

        <p className="badge__name">{channel.title}</p>
        <p className="badge__role">
          <span className="badge__grade">{role.grade}</span>
          <span className="badge__title">{role.title}</span>
        </p>

        <dl className="badge__facts">
          <div>
            <dt>소속</dt>
            <dd>유튜브콘텐츠사업부</dd>
          </div>
          <div>
            <dt>연차</dt>
            <dd>{role.years}</dd>
          </div>
          <div>
            <dt>사번</dt>
            <dd className="badge__mono">{empNo}</dd>
          </div>
          {channel.createdAt ? (
            <div>
              <dt>개설</dt>
              <dd className="badge__mono">{ymd(channel.createdAt)} 유튜브 채널</dd>
            </div>
          ) : null}
        </dl>

        <div className="badge__foot">
          <Barcode seed={channel.id} />
          <span className="seal seal--small badge__seal" aria-hidden="true">
            추정
          </span>
        </div>
      </div>
      <figcaption className="badge__note">
        재미로 만든 가상 카드예요. {waGwa(companyName)} 관련이 없고, 실제 사원증이나 신분증으로 쓸 수 없어요.
      </figcaption>
    </figure>
  )
}
