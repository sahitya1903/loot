import { getAllBlogs } from '@/lib/blogs'
import BlogsClient from './BlogsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Loot',
  description: 'Loot Blog - Stories, Tips & Inspiration.',
}

export default function BlogsPage() {
  // Strip out HTML content server-side to shrink the payload to the client
  const blogs = getAllBlogs().map(({ content: _content, ...blog }) => {
    void _content
    return blog
  })

  return <BlogsClient blogs={blogs} />
}
