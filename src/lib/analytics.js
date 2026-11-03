// Google Analytics 이벤트 전송 (public/ga.js가 gtag를 준비한다)
// GA가 꺼져 있거나 광고 차단기로 막혀도 계산기 동작에는 영향이 없다.

export function track(name, params = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params)
  } catch {
    /* 무시 */
  }
}

// 검색: GA4 권장 이벤트 'search' (보고서의 "검색어" 항목에 바로 잡힌다)
export function trackSearch(term, resultCount) {
  track('search', { search_term: term, result_count: resultCount })
}

// 채널 결과 보기: 어떤 유튜버가 많이 조회되는지
export function trackChannelView(channel, source) {
  track('view_channel', {
    channel_id: channel.id,
    channel_title: channel.title,
    subscribers: channel.subscribers,
    source, // 'search' 검색해서 봄 | 'link' 공유 링크로 들어옴
  })
}
