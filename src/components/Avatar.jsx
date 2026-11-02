export default function Avatar({ channel, size = 48 }) {
  const style = { width: size, height: size }
  if (channel.thumbnail) {
    return <img className="avatar" src={channel.thumbnail} alt="" style={style} referrerPolicy="no-referrer" />
  }
  return (
    <span className="avatar avatar--initial" style={{ ...style, background: channel.color || '#6A7389' }} aria-hidden="true">
      {channel.title.slice(0, 1)}
    </span>
  )
}
