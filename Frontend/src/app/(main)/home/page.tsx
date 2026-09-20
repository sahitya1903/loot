import { redirect } from 'next/navigation'

// `/home` is preserved as a back-compat redirect to the new feed-first surface.
export default function HomeRedirect() {
  redirect('/feed')
}
