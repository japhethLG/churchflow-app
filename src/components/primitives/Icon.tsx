import type { SVGProps } from "react";

export type IconName =
  | "home" | "users" | "user" | "calendar" | "receipt" | "chart" | "mail"
  | "settings" | "search" | "bell" | "plus" | "check" | "x" | "chevronDown"
  | "chevronRight" | "chevronLeft" | "pin" | "dots" | "filter" | "cash"
  | "check_rect" | "bank" | "phone" | "google" | "book" | "location"
  | "link" | "edit" | "trash" | "arrowRight" | "arrowUp" | "download" | "logo";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><circle cx="17" cy="7" r="3" /><path d="M22 21v-1a4 4 0 0 0-4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  pin: <><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" /><circle cx="12" cy="9" r="3" /></>,
  dots: <><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></>,
  check_rect: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h6M7 14h10" /></>,
  bank: <path d="M3 10h18M4 10 12 4l8 6M6 10v7M10 10v7M14 10v7M18 10v7M3 20h18" />,
  phone: <><path d="M6 3h12v18H6z" /><path d="M10 18h4" /></>,
  google: <>
    <path d="M21.35 11.1h-9.17v2.96h5.24c-.22 1.18-.88 2.18-1.87 2.85v2.37h3.02c1.77-1.63 2.78-4.03 2.78-6.87 0-.56-.05-1.1-.14-1.61z" fill="#4285F4" stroke="none" />
    <path d="M12.18 21c2.52 0 4.64-.83 6.18-2.26l-3.02-2.37c-.84.56-1.91.9-3.16.9-2.43 0-4.49-1.64-5.22-3.85H3.84v2.42C5.38 18.9 8.55 21 12.18 21z" fill="#34A853" stroke="none" />
    <path d="M6.96 13.42a5.4 5.4 0 0 1 0-3.44V7.56H3.84a8.99 8.99 0 0 0 0 8.28z" fill="#FBBC05" stroke="none" />
    <path d="M12.18 6.13c1.37 0 2.6.47 3.57 1.4l2.67-2.67C16.81 3.47 14.7 2.6 12.18 2.6c-3.63 0-6.8 2.1-8.34 5.16l3.12 2.42c.73-2.21 2.79-3.85 5.22-3.85z" fill="#EA4335" stroke="none" />
  </>,
  book: <><path d="M4 4a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2z" /><path d="M8 7h6M8 11h6" /></>,
  location: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.5" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />,
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  arrowUp: <path d="m6 15 6-6 6 6" />,
  download: <path d="M12 3v14M6 11l6 6 6-6M4 21h16" />,
  logo: <><path d="M4 20V8l8-5 8 5v12" /><path d="M9 20v-7h6v7" /></>,
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "name" | "size" | "color">;

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
