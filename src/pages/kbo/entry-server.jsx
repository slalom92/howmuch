// 프로야구 선수 연봉 첫 화면을 HTML로 미리 그리기 위한 진입점 (scripts/prerender-home.mjs 가 빌드 뒤에 쓴다)
import { renderToStaticMarkup } from 'react-dom/server'
import KboApp from './KboApp.jsx'

export function render() {
  return renderToStaticMarkup(<KboApp />)
}
