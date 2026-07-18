// The two-column shell every Stage 1-4 page shares: freeform content on the
// left, the review sidebar pinned on the right. Deliberately not a fixed-
// height/scroll-locked layout — the whole page scrolls together, same as the
// dashboard (Session 5).

import type { ReactNode } from 'react'

export interface StagePageLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function StagePageLayout({ children, sidebar }: StagePageLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-8 p-6">{children}</div>
      <aside className="flex flex-col gap-4 border-t border-app-border p-4 lg:border-l lg:border-t-0">
        {sidebar}
      </aside>
    </div>
  )
}
