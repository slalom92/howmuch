// Google Analytics 4
// 아래 GA_ID에 측정 ID(G-로 시작)를 넣으면 계산기와 모든 글 페이지에서 동작합니다.
// 비워 두면 아무것도 불러오지 않습니다.
;(function () {
  var GA_ID = 'G-NZ5MR1WQBM'

  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)

  var s = document.createElement('script')
  s.async = true
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
  document.head.appendChild(s)
})()
