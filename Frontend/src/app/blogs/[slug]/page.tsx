import { Metadata } from 'next'
import { getBlogBySlug, getAllBlogs } from '@/lib/blogs'
import { notFound } from 'next/navigation'
import BlogDetailClient from './BlogDetailClient'

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generate static params for all known blog slugs (SSG).
 */
export function generateStaticParams() {
  const blogs = getAllBlogs()
  return blogs.map((blog) => ({ slug: blog.slug }))
}

/**
 * Dynamic SEO metadata for each blog post.
 */
export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const blog = getBlogBySlug(slug)

  if (!blog) {
    return {
      title: 'Blog Not Found — Loot',
      description: 'The blog post you are looking for could not be found.',
    }
  }

  return {
    title: `${blog.title} — Loot Blog`,
    description: blog.shortDescription,
    openGraph: {
      title: blog.title,
      description: blog.shortDescription,
      type: 'article',
      publishedTime: blog.createdAt,
      images: [{ url: blog.coverImage }],
    },
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const blog = getBlogBySlug(slug)

  if (!blog) {
    notFound()
  }

  return <BlogDetailClient blog={blog} />
}
