/* 색 테마 정하기 + 고르기 (모든 페이지 <head> 에서 가장 먼저 읽는다)
 *
 * - 이용자가 고른 테마가 있으면 그 테마 (localStorage 'theme')
 * - 없으면 방문할 때마다 무작위. 같은 방문(탭) 안에서는 페이지를 옮겨도 같은 색 (sessionStorage)
 * - 화면이 그려지기 전에 <html data-theme> 를 정해 기본 색이 번쩍이지 않게 한다.
 * - [data-theme-toggle] 버튼을 누르면 고르기 메뉴가 열린다. 메뉴는 이 파일이 직접 만든다.
 */
(function () {
  var THEMES = [
    { id: 'navy', name: '남색 명세서', sw: ['#1a2238', '#c2362b', '#e7ebf0'], bar: '#e7ebf0' },
    { id: 'cheque', name: '초록 수표', sw: ['#15302a', '#1a714a', '#e3ebe5'], bar: '#e3ebe5' },
    { id: 'voucher', name: '보라 상품권', sw: ['#261c40', '#7b3fc0', '#ebe7f2'], bar: '#ebe7f2' },
    { id: 'kraft', name: '크라프트 봉투', sw: ['#33261a', '#2d55a8', '#e9dfcf'], bar: '#e9dfcf' },
    { id: 'night', name: '야간 정산', sw: ['#e9edf5', '#ff7a6b', '#10141d'], bar: '#10141d' },
  ]
  var KEY = 'theme'
  var VISIT_KEY = 'theme-visit'
  var root = document.documentElement

  function store(kind) {
    try {
      return kind === 'session' ? window.sessionStorage : window.localStorage
    } catch (e) {
      return null
    }
  }
  function read(kind, key) {
    try {
      var s = store(kind)
      return s ? s.getItem(key) : null
    } catch (e) {
      return null
    }
  }
  function write(kind, key, value) {
    try {
      var s = store(kind)
      if (!s) return
      if (value == null) s.removeItem(key)
      else s.setItem(key, value)
    } catch (e) {
      /* 저장할 수 없는 환경이면 이번 화면에서만 적용 */
    }
  }
  function find(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]
    return null
  }

  var picked = find(read('local', KEY)) ? read('local', KEY) : null
  var visit = read('session', VISIT_KEY)
  if (!find(visit)) {
    visit = THEMES[Math.floor(Math.random() * THEMES.length)].id
    write('session', VISIT_KEY, visit)
  }

  function apply(id) {
    var t = find(id) || THEMES[0]
    root.setAttribute('data-theme', t.id)
    var meta = document.querySelector('meta[name="theme-color"]')
    if (!meta && document.head) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    if (meta) meta.content = t.bar
  }

  apply(picked || visit)

  // ---------- 고르기 메뉴 ----------
  var menu = null
  var opener = null

  function current() {
    return picked ? picked : 'random'
  }

  function buildMenu() {
    menu = document.createElement('div')
    menu.className = 'theme-menu'
    menu.id = 'theme-menu'
    menu.setAttribute('role', 'dialog')
    menu.setAttribute('aria-label', '명세서 색 고르기')
    menu.hidden = true
    var html = '<p class="theme-menu__title">명세서 색</p><ul class="theme-menu__list">'
    html +=
      '<li><button type="button" class="theme-menu__opt" data-theme-pick="random"><span class="theme-menu__sw theme-menu__sw--random" aria-hidden="true">🎲</span>방문할 때마다 랜덤</button></li>'
    for (var i = 0; i < THEMES.length; i++) {
      var t = THEMES[i]
      html +=
        '<li><button type="button" class="theme-menu__opt" data-theme-pick="' +
        t.id +
        '"><span class="theme-menu__sw" aria-hidden="true"><i style="background:' +
        t.sw[2] +
        '"></i><i style="background:' +
        t.sw[0] +
        '"></i><i style="background:' +
        t.sw[1] +
        '"></i></span>' +
        t.name +
        '</button></li>'
    }
    html += '</ul><p class="theme-menu__note">고른 색은 이 브라우저에 기억돼요.</p>'
    menu.innerHTML = html
    document.body.appendChild(menu)
  }

  function sync() {
    if (!menu) return
    var cur = current()
    var opts = menu.querySelectorAll('[data-theme-pick]')
    for (var i = 0; i < opts.length; i++) opts[i].setAttribute('aria-pressed', opts[i].getAttribute('data-theme-pick') === cur ? 'true' : 'false')
  }

  function place() {
    if (!menu || !opener) return
    var r = opener.getBoundingClientRect()
    var w = menu.offsetWidth || 232
    var left = Math.min(window.scrollX + r.right - w, window.scrollX + document.documentElement.clientWidth - w - 8)
    menu.style.left = Math.max(window.scrollX + 8, left) + 'px'
    menu.style.top = window.scrollY + r.bottom + 8 + 'px'
  }

  function open(btn) {
    if (!menu) buildMenu()
    opener = btn
    sync()
    menu.hidden = false
    place()
    btn.setAttribute('aria-expanded', 'true')
    var on = menu.querySelector('[aria-pressed="true"]')
    if (on) on.focus()
  }

  function close(returnFocus) {
    if (!menu || menu.hidden) return
    menu.hidden = true
    if (opener) {
      opener.setAttribute('aria-expanded', 'false')
      if (returnFocus) opener.focus()
    }
  }

  function choose(id) {
    root.classList.add('theme-fade')
    if (id === 'random') {
      picked = null
      write('local', KEY, null)
      apply(visit)
    } else {
      picked = id
      write('local', KEY, id)
      apply(id)
    }
    sync()
    setTimeout(function () {
      root.classList.remove('theme-fade')
    }, 400)
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'theme_pick', { theme: id })
    } catch (e) {
      /* 무시 */
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target
    var toggle = t.closest && t.closest('[data-theme-toggle]')
    if (toggle) {
      if (menu && !menu.hidden && opener === toggle) close(false)
      else open(toggle)
      return
    }
    var pick = t.closest && t.closest('[data-theme-pick]')
    if (pick) {
      choose(pick.getAttribute('data-theme-pick'))
      close(true)
      return
    }
    if (menu && !menu.hidden && !menu.contains(t)) close(false)
  })

  document.addEventListener('keydown', function (e) {
    if (!menu || menu.hidden) return
    if (e.key === 'Escape') close(true)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var opts = Array.prototype.slice.call(menu.querySelectorAll('[data-theme-pick]'))
      var i = opts.indexOf(document.activeElement)
      var n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length
      opts[n].focus()
      e.preventDefault()
    }
  })

  window.addEventListener('resize', function () {
    if (menu && !menu.hidden) place()
  })

  window.__theme = { list: THEMES, choose: choose }
})()
