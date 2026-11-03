import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// npm run dev 에서도 /api/* 서버 함수가 동작하도록 Vite 개발 서버에 연결한다.
// 배포(Vercel)에서는 api/ 폴더가 그대로 서버 함수가 되므로 이 플러그인은 쓰이지 않는다.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/(?:api\/(search|channel|corps|company|benchmarks|share)|(s))\/?(?:\?|$)/)
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
    base: './',
  }
})
