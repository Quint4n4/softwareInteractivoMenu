import type { CSSProperties, ReactNode } from "react";

const P: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
  menu: <g><path d="M6 3v8M6 11a3 3 0 0 0 3-3V3M6 11v10M16 3c-1.5 1-2 3-2 6s.5 4 2 4m0 0v8m0-8h0" /></g>,
  cart: <g><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.2l2.2 12.3a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" /></g>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z" />,
  trash: <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  coffee: <g><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17M7 3.5c-.5 1 .5 1.5 0 2.5M11 3.5c-.5 1 .5 1.5 0 2.5" /></g>,
  edit: <path d="M4 20h4l10.5-10.5a2 2 0 0 0-2.83-2.83L5 17.5zM14 7l3 3" />,
  grip: <g><circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" /></g>,
  eye: <g><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>,
  chart: <g><path d="M4 20V4M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12.5" y="8" width="3" height="9" /><rect x="18" y="14" width="3" height="3" /></g>,
  palette: <g><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.5-2.5H18a3 3 0 0 0 3-3c0-5-4-7.5-9-7.5z" /><circle cx="7.5" cy="11" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16.5" cy="11" r="1" /></g>,
  type: <path d="M4 6V4h16v2M9 20h6M12 4v16" />,
  image: <g><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></g>,
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h12" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  alert: <g><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></g>,
  box: <g><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></g>,
  qr: <g><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 14v.01M17 20v.01M20 17v3" /></g>,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></g>,
  chevron: <path d="M9 5l7 7-7 7" />,
  back: <path d="M15 5l-7 7 7 7" />,
  receipt: <path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4zM9 8h6M9 12h6M9 16h4" />,
  clock: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></g>,
  bell: <g><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></g>,
  pin: <g><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></g>,
  leaf: <g><path d="M4 20c0-9 6-15 16-15 0 10-6 16-16 15z" /><path d="M9 15c3-3 6-4 9-5" /></g>,
  search: <g><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.6-3.6" /></g>,
  globe: <g><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.6 5.7 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.7-3.6-9s1.1-6.4 3.6-9z" /></g>,
  card: <g><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 9.5h19M6 15h4" /></g>,
  cash: <g><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5h.01M18 14.5h.01" /></g>,
};

export default function Icon({
  name,
  size = 22,
  stroke = 1.9,
  color = "currentColor",
  fill = "none",
  style,
}: {
  name: string;
  size?: number;
  stroke?: number | string;
  color?: string;
  fill?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {P[name] ?? null}
    </svg>
  );
}
