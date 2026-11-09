// 카카오맵 (지도를 열 때만 불러온다)
//
// - 키: VITE_KAKAO_MAP_KEY (카카오디벨로퍼스 JavaScript 키). 브라우저에 공개되는 키이고, 등록한 도메인에서만 동작한다.
// - 주소 → 좌표는 지도를 여는 그 순간에 카카오 로컬(services 라이브러리)로 바꾸고, 저장하지 않는다.
//   카카오 정책상 로컬 API 결과는 실시간으로만 쓸 수 있다.
const KEY = import.meta.env.VITE_KAKAO_MAP_KEY

export const hasMap = () => Boolean(KEY)

let loading = null

export function loadKakao() {
  if (typeof window === 'undefined') return Promise.reject(new Error('브라우저에서만 쓸 수 있어요'))
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KEY)}&autoload=false&libraries=services`
    s.async = true
    s.onload = () => {
      if (!window.kakao?.maps) return reject(new Error('카카오맵을 불러오지 못했어요'))
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    s.onerror = () => reject(new Error('카카오맵을 불러오지 못했어요'))
    document.head.appendChild(s)
  }).catch((e) => {
    loading = null
    throw e
  })
  return loading
}

const addressSearch = (kakao, q) =>
  new Promise((resolve) => {
    new kakao.maps.services.Geocoder().addressSearch(q, (res, status) => resolve(status === kakao.maps.services.Status.OK && res[0] ? res[0] : null))
  })

const keywordSearch = (kakao, q) =>
  new Promise((resolve) => {
    new kakao.maps.services.Places().keywordSearch(q, (res, status) => resolve(status === kakao.maps.services.Status.OK && res[0] ? res[0] : null))
  })

// 단지 위치 찾기: 지번 주소 → 단지 이름 검색 → 동 중심 순서로 시도한다
// apt.full 은 "경기도 수원시 장안구" 같은 시군구 전체 이름. 돌려주는 값: { lat, lng, exact } (exact=false 면 동 중심)
export async function locate(kakao, apt) {
  const base = `${apt.full} ${apt.dong}`
  if (apt.jibun) {
    const r = await addressSearch(kakao, `${base} ${apt.jibun}`)
    if (r) return { lat: Number(r.y), lng: Number(r.x), exact: true }
  }
  const p = await keywordSearch(kakao, `${apt.sggName} ${apt.dong} ${apt.name}`)
  if (p) return { lat: Number(p.y), lng: Number(p.x), exact: true }
  const d = await addressSearch(kakao, base)
  if (d) return { lat: Number(d.y), lng: Number(d.x), exact: false }
  return null
}

// 내 위치(위도, 경도)가 어느 시도·시군구인지 (법정동 기준). 돌려주는 값: { sido: '경기도', sgg: '수원시 장안구' }
export function regionOf(kakao, lat, lng) {
  return new Promise((resolve) => {
    new kakao.maps.services.Geocoder().coord2RegionCode(lng, lat, (res, status) => {
      if (status !== kakao.maps.services.Status.OK) return resolve(null)
      const b = res.find((x) => x.region_type === 'B') || res[0]
      resolve(b ? { sido: b.region_1depth_name, sgg: b.region_2depth_name } : null)
    })
  })
}

// 시군구 중심 좌표들 (시군구 전체 이름으로 그때그때 찾는다, 저장하지 않는다). 돌려주는 값: { 코드: [위도, 경도] }
export async function sggCenters(kakao, sggs) {
  const out = {}
  const queue = [...sggs]
  // 한꺼번에 많이 부르지 않도록 6개씩
  await Promise.all(
    Array.from({ length: Math.min(6, queue.length) }, async () => {
      while (queue.length) {
        const g = queue.shift()
        const r = await addressSearch(kakao, g.full)
        if (r) out[g.code] = [Number(r.y), Number(r.x)]
      }
    }),
  )
  return out
}
