import { Compass } from 'lucide-react'

interface Props {
  title?: string
  body?: string
  action?: React.ReactNode
}

export function FeedEmpty({ title = 'Quiet around here', body = 'Try a wider radius or check the Trending tab.', action }: Props) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <Compass className="h-6 w-6 text-white/60" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-white/60">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
