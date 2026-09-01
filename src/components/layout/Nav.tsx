import type { ReactNode } from 'react'

interface NavProps {
  right?: ReactNode
}

export function Nav({ right }: NavProps) {
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1160px] items-center gap-4 px-7 py-4">
        <div className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <span className="grid size-7 place-items-center rounded-full border-[3px] border-violet" />
          Adsplay
          <sup className="text-[9px] text-mute">®</sup>
          <small className="ml-1.5 rounded-xl bg-lilac px-2.5 py-1 font-body text-xs font-bold text-violet">Analisador</small>
        </div>
        <div className="ml-auto">{right}</div>
      </div>
    </nav>
  )
}
