import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * {slug}.cornerpage.co 서브도메인 라우팅.
 *
 * 실제 서비스에서는: cornerpage.co(루트)는 입력 폼, {slug}.cornerpage.co는
 * 유저가 만든 미니홈페이지(slug는 sites.slug — 기본값은 id 복사, 유저가 나중에
 * 원하는 문자열로 바꿀 수 있다). 하나의 Next.js 배포가 와일드카드 DNS로 두
 * 트래픽을 전부 받고, 여기서 host 헤더를 보고 내부적으로 /site/[slug]로
 * rewrite한다. 그래서 신규 유저 생성 시 별도 빌드/배포 없이 DB row 하나로
 * 즉시 서비스된다.
 *
 * 로컬 개발: 브라우저가 *.localhost를 127.0.0.1로 자동 해석해주므로(RFC 6761),
 * 예: http://cafe-millmuldabang.localhost:3000 로 접속하면 아래 로직이
 * "cafe-millmuldabang"을 서브도메인으로 인식한다.
 */
function extractSubdomain(hostHeader: string): string | null {
  const hostname = hostHeader.split(":")[0]; // 포트 제거

  if (hostname.endsWith(".localhost")) {
    return hostname.slice(0, -".localhost".length);
  }

  if (hostname.endsWith(".cornerpage.co")) {
    const sub = hostname.slice(0, -".cornerpage.co".length);
    return sub === "www" ? null : sub;
  }

  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    // 루트 도메인(cornerpage.co, localhost:3000) — 입력 폼/개발용 라우트 그대로 통과
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname =
    url.pathname === "/"
      ? `/site/${subdomain}`
      : `/site/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * 정적 자산·최적화 경로는 제외.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
