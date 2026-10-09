// Vite's BASE_URL is `/` locally and `/eb-fun-platform/` on Pages, always
// with a trailing slash. Drop that slash so the site root matches with or
// without it. `/` keeps the router's default basename.
export function routerBasename(baseUrl = import.meta.env.BASE_URL): string | undefined {
  if (baseUrl === '/' || baseUrl === '') return undefined
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}
