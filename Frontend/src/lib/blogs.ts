import blogs from '@/data/blogs.json'

export interface Blog {
  id: number
  title: string
  slug: string
  coverImage: string
  shortDescription: string
  content: string
  createdAt: string
}

/**
 * Get all blogs from the data source.
 * In Phase 2, this will be replaced with an API call.
 */
export const getAllBlogs = (): Blog[] => {
  return blogs as Blog[]
}

/**
 * Get a single blog by its slug.
 * In Phase 2, this will be replaced with an API call.
 */
export const getBlogBySlug = (slug: string): Blog | undefined => {
  return (blogs as Blog[]).find((b) => b.slug === slug)
}
