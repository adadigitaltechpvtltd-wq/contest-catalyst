import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BOT_REGEX =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot/i

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const isBot = BOT_REGEX.test(ua)

  if (!isBot) {
    // Normal users → React SPA
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Handle gallery pages
  // /gallery/{category}/{contest}/{photo}
  const galleryMatch = pathname.match(
    /^\/gallery\/([^/]+)\/([^/]+)\/([^/]+)$/
  )

  if (galleryMatch) {
    const [, category, contest, photo] = galleryMatch

    // Redirect crawler to static SEO HTML
    url.pathname = `/seo/${category}/${contest}/${photo}`

    return NextResponse.rewrite(url)
  }

  // Handle contest pages
  // /contest/{category}/{contest}
  const contestMatch = pathname.match(
    /^\/contest\/([^/]+)\/([^/]+)$/
  )

  if (contestMatch) {
    const [, category, contest] = contestMatch
    url.pathname = `/seo/contest/${category}/${contest}`

    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/gallery/:path*',
    '/contest/:path*',
  ],
}
// End of middleware.ts ---