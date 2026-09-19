import { NotFoundGame } from '@/components/NotFoundGame'

export default function NotFound() {
  return (
    <div className="not-found-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <NotFoundGame />
      </div>
    </div>
  )
}
