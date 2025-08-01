// API Response Types
export interface ApiResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface ApiError {
  detail: string
  code?: string
  field_errors?: Record<string, string[]>
}

// User Types
export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
  is_staff?: boolean
  date_joined: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

// Blog Types
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  posts_count: number
  created_at: string
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  image?: string
  author: User
  category: Category
  tags: Tag[]
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at?: string
  comments_count: number
  reading_time: number
}

export interface Comment {
  id: number
  content: string
  author: User
  post: number
  parent?: number
  replies?: Comment[]
  created_at: string
  updated_at: string
  is_approved: boolean
}

export interface CreateCommentData {
  content: string
  post?: number
  parent?: number
}

// User Filters for Dashboard
export interface UserFilters {
  search?: string
  is_active?: boolean
  is_staff?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  search?: string
  category?: string
  author?: string
  tags?: string[]
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
  ordering?: string
}

export interface PostsParams {
  page?: number
  page_size?: number
  category?: string
  author?: string
  search?: string
  ordering?: string
}

export interface CommentParams {
  post?: number
  page?: number
  page_size?: number
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  loading: boolean
  error: string | null
}

export interface BlogState {
  posts: Post[]
  currentPost: Post | null
  categories: Category[]
  tags: Tag[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    hasNext: boolean
    hasPrevious: boolean
    total: number
  }
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Component Props Types
export interface PostCardProps {
  post: Post
  showExcerpt?: boolean
  showCategory?: boolean
  showAuthor?: boolean
  showDate?: boolean
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface SearchBarProps {
  placeholder?: string
  showFilters?: boolean
  autoFocus?: boolean
}

// Form Types
export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export interface NewsletterForm {
  email: string
}

// SEO Types
export interface SEOMeta {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  locale?: string
}