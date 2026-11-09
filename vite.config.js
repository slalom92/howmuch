import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

// npm run dev 에서도 /api/* 서버 함수가 동작하도록 Vite 개발 서버에 연결한다.
// 배포(Vercel)에서는 api/ 폴더가 그대로 서버 함수가 되므로 이 플러그인은 쓰이지 않는다.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // /channel/<핸들>/ → /api/page/?slug=<핸들> (배포의 vercel.json rewrites 와 같은 동작)
        const ch = req.url.match(/^\/channel\/([^/?]+)\/?(\?.*)?$/)
        if (ch) {
          const extra = ch[2] ? '&' + ch[2].slice(1) : ''
          req.url = `/api/page/?slug=${ch[1]}${extra}`
        }
        const m = req.url.match(/^\/(?:api\/(search|channel|corps|company|benchmarks|share|page|trending)|(s))\/?(?:\?|$)/)
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1] || 'share'}.js`)
          await mod.default(req, res)
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // .env.local 의 서버용 키를 개발 서버의 서버 함수에서 읽을 수 있게 한다 (브라우저 코드에는 들어가지 않음)
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['YT_API_KEY', 'DART_API_KEY', 'KOSIS_API_KEY', 'KOSIS_INDUSTRY_URL']) {
    if (env[k] && !process.env[k]) process.env[k] = env[k]
  }

  return {
    plugins: [react(), devApi()],
    // 채널 페이지(/channel/…/)에서도 자산을 찾도록 절대 경로로 둔다
    base: '/',
    // 페이지마다 HTML 진입점을 따로 둔다 (라우터로 합치기 전까지)
    //   /               → index.html (계산기 고르는 첫 화면, 정적 HTML)
    //   /youtuber/      → youtuber/index.html (유튜버 수익 계산기)
    //   /wedding-gift/  → wedding-gift/index.html (축의금 계산기)
    //   /kbo/           → kbo/index.html (프로야구 선수 연봉)
    //   /klpga/         → klpga/index.html (여자골프 선수 상금)
    //   /kpga/          → kpga/index.html (남자골프 선수 상금, 화면은 klpga 와 같이 쓴다)
    //   /pga/           → pga/index.html (PGA 투어 선수 상금, 화면은 klpga 와 같이 쓴다)
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          youtuber: fileURLToPath(new URL('./youtuber/index.html', import.meta.url)),
          weddingGift: fileURLToPath(new URL('./wedding-gift/index.html', import.meta.url)),
          kbo: fileURLToPath(new URL('./kbo/index.html', import.meta.url)),
          klpga: fileURLToPath(new URL('./klpga/index.html', import.meta.url)),
          kpga: fileURLToPath(new URL('./kpga/index.html', import.meta.url)),
          pga: fileURLToPath(new URL('./pga/index.html', import.meta.url)),
        },
      },
    },
  }
})
