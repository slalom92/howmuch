// 숫자의 출처 표시: YouTube에서 받은 값인지, 돈미터가 계산한 값인지
export default function SourceTag({ kind = 'est', children }) {
  const label = children || (kind === 'yt' ? 'YouTube 제공' : '돈미터 추정')
  return <span className={`src-tag src-tag--${kind}`}>{label}</span>
}
