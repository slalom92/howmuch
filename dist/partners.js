/* 쿠팡 파트너스 (모든 페이지 <head> 에서 theme.js 다음에 읽는다)
 *
 * 설정은 이 파일 맨 위 두 줄이 전부다.
 * - TRACKING: 쿠팡 파트너스 추적 코드 (AF…)
 * - BANNER_ID: 파트너스 대시보드 > 링크 생성 > 다이나믹 배너 에서 만든 배너의 id (숫자)
 * - RIGHT_RAIL_ID: PC 오른쪽 세로 배너에만 따로 쓰는 배너 id (비우면 BANNER_ID)
 *   비워 두면 쿠팡 배너와 대가성 문구가 어디에도 나오지 않는다 (지금까지와 같음).
 *
 * 하는 일
 * 1) window.__partners 에 설정을 담아 둔다. 계산기 페이지(React)의 광고 자리(AdSlot)는 이 값이 있으면
 *    애드센스 대신 쿠팡 다이나믹 배너를 넣는다.
 * 2) 홈 화면처럼 자리를 직접 표시해 둔 페이지는 그 자리에 넣는다.
 *    <div data-partners="note"></div> → 대가성 문구, <div data-partners="ad"></div> → 가로 배너
 *    <div data-partners="rails"></div> → 넓은 PC 화면 좌우 세로 배너(160×600, 화면에 고정)
 * 3) 글 페이지(가이드·뉴스 등 <main class="doc">)에는 직접 넣는다.
 *    - 본문 첫머리(요약 문단 바로 아래)에 대가성 문구
 *    - 본문 중간(두 번째 소제목 앞)과 본문 끝에 배너 한 개씩
 *    - <main class="doc" data-rails> 이면 넓은 PC 화면 좌우 세로 배너도 (순위·가이드·자주 묻는 질문·계산 방법 페이지)
 *
 * 정책 메모 (쿠팡 파트너스 / 공정위 추천·보증 심사지침)
 * - 대가성 문구는 게시물 제목 또는 첫 부분에, 배너 가까이에 둔다.
 * - 커버형(본문을 덮는) 배너는 2026-06-08부터 금지. 여기 배너는 모두 본문 흐름 안에 자리를 차지한다.
 * - "클릭해 주세요" 같은 클릭 유도 문구를 쓰지 않는다.
 */
(function () {
  var TRACKING = 'AF1572500'
  var BANNER_ID = '1058960'
  var RIGHT_RAIL_ID = '1058977'

  var NOTE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
  // 배너를 넣지 않는 페이지 (정책·연락처 안내)
  var SKIP = /^\/(privacy|terms|contact)\//

  var id = String(BANNER_ID).replace(/\D/g, '')
  if (!id || !/^AF\d+$/.test(TRACKING)) {
    window.__partners = null
    return
  }

  var rightId = String(RIGHT_RAIL_ID).replace(/\D/g, '') || id

  // spot: 'rail-right' 이면 오른쪽 세로 배너용 id
  function src(w, h, spot) {
    return (
      'https://ads-partners.coupang.com/widgets.html?id=' + (spot === 'rail-right' ? rightId : id) +
      '&template=carousel&trackingCode=' + TRACKING +
      '&subId=&width=' + w + '&height=' + h + '&tsource='
    )
  }

  // 가로 배너 크기: 자리 폭에 맞추되 너무 넓지 않게. 좁은 화면은 높이를 낮춘다.
  function wideSize(width) {
    var w = Math.max(280, Math.min(960, Math.floor(width / 10) * 10))
    return [w, w < 600 ? 120 : 140]
  }

  window.__partners = { id: id, tracking: TRACKING, note: NOTE, src: src, wideSize: wideSize }

  function frame(w, h, lazy, spot) {
    var f = document.createElement('iframe')
    f.src = src(w, h, spot)
    f.width = String(w)
    f.height = String(h)
    f.title = '쿠팡 추천 상품'
    f.setAttribute('frameborder', '0')
    f.setAttribute('scrolling', 'no')
    f.setAttribute('referrerpolicy', 'unsafe-url')
    if (lazy) f.setAttribute('loading', 'lazy')
    return f
  }

  function banner(doc, lazy) {
    var box = document.createElement('aside')
    box.className = 'partners-ad'
    box.setAttribute('aria-label', '광고')
    var label = document.createElement('p')
    label.className = 'partners-ad__label'
    label.textContent = '광고 · 쿠팡 파트너스'
    box.appendChild(label)
    var size = wideSize(innerWidth(doc) || 640)
    box.appendChild(frame(size[0], size[1], lazy))
    return box
  }

  function innerWidth(el) {
    var cs = getComputedStyle(el)
    return el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0)
  }

  // 좌우 세로 배너: 계산기 페이지(AdSlot.jsx WIDE_QUERY)와 같은 조건의 넓은 화면에서만 만든다
  var WIDE_QUERY = '(min-width: 1444px) and (min-height: 760px), (min-width: 1300px) and (min-height: 820px)'
  function rails(el) {
    var mq = window.matchMedia(WIDE_QUERY)
    function rail(side) {
      var box = document.createElement('aside')
      box.className = 'partners-rail partners-rail--' + side
      box.setAttribute('aria-label', '광고')
      var label = document.createElement('p')
      label.className = 'partners-ad__label'
      label.textContent = '광고 · 쿠팡 파트너스'
      box.appendChild(label)
      box.appendChild(frame(160, 600, false, 'rail-' + side))
      return box
    }
    function apply() {
      if (mq.matches && !el.childNodes.length) {
        el.appendChild(rail('left'))
        el.appendChild(rail('right'))
      } else if (!mq.matches) {
        while (el.firstChild) el.removeChild(el.firstChild)
      }
    }
    apply()
    if (mq.addEventListener) mq.addEventListener('change', apply)
  }

  // 자리 표시(data-partners)가 있는 페이지
  function mountMarked() {
    var spots = document.querySelectorAll('[data-partners]')
    if (!spots.length) return false
    for (var i = 0; i < spots.length; i++) {
      var el = spots[i]
      if (el.childNodes.length) continue
      var kind = el.getAttribute('data-partners')
      if (kind === 'rails') {
        rails(el)
      } else if (kind === 'note') {
        el.className = 'partners-note'
        el.textContent = NOTE
      } else {
        var holder = el.parentNode
        el.className = 'partners-ad'
        el.setAttribute('role', 'complementary')
        el.setAttribute('aria-label', '광고')
        var label = document.createElement('p')
        label.className = 'partners-ad__label'
        label.textContent = '광고 · 쿠팡 파트너스'
        el.appendChild(label)
        var size = wideSize(innerWidth(holder) || 360)
        el.appendChild(frame(size[0], size[1], true))
      }
    }
    return true
  }

  function mount() {
    if (SKIP.test(location.pathname)) return
    if (mountMarked()) return
    var doc = document.querySelector('main.doc')
    if (!doc) return
    if (doc.hasAttribute('data-rails') && !document.querySelector('.partners-rails')) {
      var host = document.createElement('div')
      host.className = 'partners-rails'
      document.body.appendChild(host)
      rails(host)
    }
    if (doc.querySelector('.partners-note')) return

    var note = document.createElement('p')
    note.className = 'partners-note'
    note.textContent = NOTE
    var anchor = doc.querySelector('.lede') || doc.querySelector('.meta') || doc.querySelector('h1')
    if (anchor) anchor.insertAdjacentElement('afterend', note)
    else doc.insertBefore(note, doc.firstChild)

    var h2s = doc.querySelectorAll(':scope > h2')
    if (h2s.length >= 3) h2s[1].insertAdjacentElement('beforebegin', banner(doc, true))
    doc.appendChild(banner(doc, true))
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
})()
