// PGA 투어 선수 상금 첫 화면을 HTML로 미리 그리기 위한 진입점 (scripts/prerender-home.mjs 가 빌드 뒤에 쓴다)
import { renderToStaticMarkup } from 'react-dom/server'
import GolfApp from '../klpga/KlpgaApp.jsx'
import PGA_TOUR from './pga.js'

export function render() {
  return renderToStaticMarkup(<GolfApp T={PGA_TOUR} />)
}
