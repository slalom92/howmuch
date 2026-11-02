import { useState } from 'react'

export default function SearchBar({ onSearch, busy, examples = [] }) {
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) onSearch(q.trim())
  }

  return (
    <div className="search">
      <form className="search__form" onSubmit={submit} role="search">
        <label htmlFor="q" className="sr-only">
          유튜버 검색
        </label>
        <input
          id="q"
          className="search__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="채널 이름, @핸들 또는 채널 주소"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button className="search__button" type="submit" disabled={busy || !q.trim()}>
          {busy ? '계산하는 중' : '수익 계산'}
        </button>
      </form>
      {examples.length > 0 && (
        <p className="search__examples">
          예시로 보기
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              disabled={busy}
              onClick={() => {
                setQ(ex)
                onSearch(ex)
              }}
            >
              {ex}
            </button>
          ))}
        </p>
      )}
    </div>
  )
}
