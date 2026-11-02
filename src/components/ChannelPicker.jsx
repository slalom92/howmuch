import Avatar from './Avatar.jsx'
import { count } from '../lib/format.js'

export default function ChannelPicker({ channels, onPick }) {
  return (
    <section className="picker" aria-labelledby="picker-title">
      <h2 id="picker-title" className="picker__title">
        어느 채널인가요?
      </h2>
      <ul className="picker__list">
        {channels.map((c) => (
          <li key={c.id}>
            <button type="button" className="picker__item" onClick={() => onPick(c)}>
              <Avatar channel={c} size={40} />
              <span className="picker__name">
                {c.title}
                {c.handle && <span className="picker__handle">{c.handle}</span>}
              </span>
              <span className="picker__subs">
                {c.hiddenSubscribers ? '구독자 비공개' : `구독자 ${count(c.subscribers)}명`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
