export function requestInterceptor(accesstoken) {
  const { fetch: originalFetch } = window

  window.fetch = async (...args) => {
    const [resource, config] = args

    const response = await originalFetch(resource, {
      ...config,
    })
    // console.log('response$$$$', response.status)
    if (response.status == 401) {
      const currentPath = window.location.pathname + window.location.search
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectPath', currentPath)
      }

      window.location.replace('/login')
    }
    return response
  }
}
