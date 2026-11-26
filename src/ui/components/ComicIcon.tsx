import type { ReactNode } from 'react';

const drawings = {
  home: <><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z" /></>,
  book: <><path d="M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Z" /><path d="M12 6v15M5 8c2 0 3 0 4 1m6 0c1-1 2-1 4-1" /></>,
  journal: <><rect x="5" y="3" width="15" height="18" rx="2" /><path d="M3 7h4m-4 5h4m-4 5h4m4-10h5m-5 5h5" /></>,
  settings: <><path d="M10 3h4l1 3 3 .5 3 3-1.5 2.5L21 15l-3 3-3 .5-1 2.5h-4l-1-2.5-3-.5-3-3 1.5-3L3 9.5l3-3L9 6z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
  play: <path d="m7 4 14 8-14 8z" fill="currentColor" />,
  back: <path d="m14 5-7 7 7 7" />,
  next: <path d="m9 5 7 7-7 7" />,
  turn: <path d="M9 18v-5a5 5 0 0 1 10 0v5M5 14l4 5 4-5" />,
  people: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3z" /></>,
  bag: <><rect x="4" y="8" width="16" height="13" rx="2" /><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3m-12 5h16m-9 0v3h2v-3" /></>,
  steps: <><path d="M2 21h20M4 17h16M7 13h10m-8-4h6M11 5h2" /><path d="m2 21 9-16m11 16L13 5" /></>,
} satisfies Record<string, ReactNode>;

export function ComicIcon({ name }: { name: keyof typeof drawings }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="comic-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawings[name]}
    </svg>
  );
}
