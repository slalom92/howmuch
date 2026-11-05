import { useEffect, useId, useRef, useState } from 'react'
import { loadDirectory, suggest, exactMatch, toQuery } from '../lib/directory.js'
import { count } from '../lib/format.js'
import { track } from '../lib/analytics.js'

// 검색창 + 자동완성 (WAI-ARIA combobox 패턴)
// 후보를 고르거나 목록에 똑같은 이름이 있으면 @핸들로 찾는다 → YouTube 이름 검색을 아낀다.
export default function SearchBar({ onSearch, busy, examples = [] }) {
  const [q, setQ] = useState('')
  const [dir, setDir] = useState(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const boxRef = useRef(null)

  const items = open && dir ? suggest(dir, q) : []
  const shown = items.length > 0 && !/^(https?:|www\.|youtube\.com)/i.test(q.trim())

  // 처음 검색창을 건드릴 때 목록을 받는다 (첫 화면 로딩에는 영향 없음)
  const ensureDir = () => {
    if (!dir) loadDirectory().then(setDir)
  }

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (it, how) => {
    setQ(it.n)
    setOpen(false)
    setActive(-1)
    track('search_suggest', { method: how, channel_title: it.n })
    onSearch(toQuery(it))
  }

  const submit = (e) => {
    e.preventDefault()
    const text = q.trim()
    if (!text) return
    if (shown && active >= 0 && items[active]) return choose(items[active], 'keyboard')
    setOpen(false)
    const hit = dir && exactMatch(dir, text)
    if (hit) return choose(hit, 'exact')
    onSearch(text)
  }

  const onKeyDown = (e) => {
    if (!shown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="search" ref={boxRef}>
      <form className="search__form" onSubmit={submit} role="search">
        <label htmlFor="q" className="sr-only">
          유튜버 검색
        </label>
        <input
          id="q"
          className="search__input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(-1)
            ensureDir()
          }}
          onFocus={() => {
            ensureDir()
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          placeholder="채널 이름, @핸들 또는 채널 주소"
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={listId}
          aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        />
        <button className="search__button" type="submit" disabled={busy || !q.trim()}>
          {busy ? '계산하는 중' : '수익 계산'}
        </button>
      </form>

      <ul className="suggest" id={listId} role="listbox" aria-label="채널 추천" hidden={!shown}>
        {shown &&
          items.map((it, i) => (
            <li
              key={it.s}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`suggest__item${i === active ? ' is-active' : ''}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(it, 'click')}
              onPointerEnter={() => setActive(i)}
            >
              <span className="suggest__name">{it.n}</span>
              <span className="suggest__meta">
                {/^UC[\w-]{22}$/.test(it.s) ? '' : `@${it.s}`}
                {it.c ? ` · 구독자 ${count(it.c)}명` : ''}
              </span>
            </li>
          ))}
      </ul>

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
