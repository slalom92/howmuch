import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// npm run dev 에서도 /api/* 서버 함수가 동작하도록 Vite 개발 서버에 연결한다.
// 배포(Vercel)에서는 api/ 폴더가 그대로 서버 함수가 되므로 이 플러그인은 쓰이지 않는다.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/(search|channel)(?:\?|$)/)
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`)
          await mod.default(req, res)
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // .env.local 의 YT_API_KEY 를 개발 서버의 서버 함수에서 읽을 수 있게 한다 (브라우저 코드에는 들어가지 않음)
  const env = loadEnv(mode, process.cwd(), '')
  if (env.YT_API_KEY && !process.env.YT_API_KEY) process.env.YT_API_KEY = env.YT_API_KEY

  return {
    plugins: [react(), devApi()],
    base: './',
  }
})
