/** 실제 서비스 로고 대신 의미만 전달하는 제네릭 선 아이콘(전화·채팅·지도핀·카메라·문서·재생·점).
 * channel-button 컴포넌트 스펙의 icon_color(--brand)는 currentColor로 부모에서 상속받는다. */
export function ChannelIcon({ type, className }: { type: string; className?: string }) {
  const common = {
    className,
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    "aria-hidden": true,
  } as const;

  switch (type) {
    case "call":
      return (
        <svg {...common}>
          <path
            d="M5 3h3l1.5 4-2 1.5a10 10 0 0 0 4 4l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14 14 0 0 1 3.5 4.6 1.5 1.5 0 0 1 5 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "kakao":
      return (
        <svg {...common}>
          <path
            d="M10 3.5c-4.14 0-7.5 2.6-7.5 5.8 0 2.03 1.34 3.82 3.37 4.86l-.86 3.14a.35.35 0 0 0 .53.39l3.55-2.3c.29.03.6.04.91.04 4.14 0 7.5-2.6 7.5-5.9s-3.36-5.9-7.5-5.9Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "naver_reservation":
    case "naver_map":
      return (
        <svg {...common}>
          <path
            d="M10 18s6-5.6 6-10.2A6 6 0 0 0 4 7.8C4 12.4 10 18 10 18Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="7.7" r="2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "instagram_dm":
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="14.2" cy="5.8" r="0.9" fill="currentColor" />
        </svg>
      );
    case "naver_blog":
      return (
        <svg {...common}>
          <rect x="3.5" y="3" width="13" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 7h7M6.5 10h7M6.5 13h4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="14" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8.7 8.3v3.4l3-1.7-3-1.7Z" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}
