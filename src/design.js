// PC 2단 화면(design.css 의 .main--split)에서 왼쪽 고르기 카드(.split-in 안의 form)가 화면보다 낮으면
// 결과를 내려 읽는 동안 따라 내려오게 한다. 화면보다 길면 붙이지 않는다 (아래쪽 칩을 못 누르게 되므로).
// 따라 내려오는 범위는 .split-in 상자 안(= 결과 칸 높이)까지다.
if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
  const mq = window.matchMedia('(min-width: 1100px)')
  const check = () => {
    document.querySelectorAll('.split-in > form').forEach((el) => {
      // 위 92px(결과 띠) + 아래 여유 24px 안에 다 들어갈 때만
      el.classList.toggle('is-sticky', mq.matches && el.offsetHeight < window.innerHeight - 116)
    })
  }
  const ro = new ResizeObserver(check)
  const watch = () => {
    document.querySelectorAll('.split-in > form').forEach((el) => ro.observe(el))
    check()
  }
  window.addEventListener('resize', check)
  if (mq.addEventListener) mq.addEventListener('change', check)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(watch, 0))
  else setTimeout(watch, 0)
  // React 가 화면을 그린 뒤에도 한 번 더
  window.addEventListener('load', watch)
}
