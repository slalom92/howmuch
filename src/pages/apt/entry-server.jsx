// 연봉 모아 집 사기 첫 화면을 HTML로 미리 그리기 위한 진입점 (scripts/prerender-home.mjs 가 빌드 뒤에 쓴다)
import { renderToStaticMarkup } from 'react-dom/server'
import AptApp from './AptApp.jsx'

export function render() {
  return renderToStaticMarkup(<AptApp />)
}
