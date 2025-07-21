// 一時的なメモリストレージ（データベース接続問題回避）
export interface Repository {
  id: string
  name: string
  url: string
  owner: string
  userId: string
  createdAt: string
}

export let repositories: Repository[] = []

export function addRepository(repo: Repository) {
  repositories.push(repo)
}

export function getRepositoriesByUserId(userId: string): Repository[] {
  return repositories.filter(repo => repo.userId === userId)
}

export function getRepositoryById(id: string): Repository | undefined {
  return repositories.find(repo => repo.id === id)
}

export interface Article {
  id: string
  title: string
  content: string
  repositoryId: string
  repositoryName: string
  userId: string
  pullRequestIds: string[]
  createdAt: string
  updatedAt: string
}

export let articles: Article[] = []

export function addArticle(article: Article) {
  articles.push(article)
}

export function getArticlesByUserId(userId: string): Article[] {
  return articles.filter(article => article.userId === userId)
}

export function getArticleById(id: string): Article | undefined {
  return articles.find(article => article.id === id)
}

export function updateArticle(id: string, updates: Partial<Article>): Article | undefined {
  const index = articles.findIndex(article => article.id === id)
  if (index === -1) return undefined
  
  articles[index] = { ...articles[index], ...updates, updatedAt: new Date().toISOString() }
  return articles[index]
}

export function deleteArticle(id: string): boolean {
  const index = articles.findIndex(article => article.id === id)
  if (index === -1) return false
  
  articles.splice(index, 1)
  return true
}

// PR情報のキャッシュ
export interface CachedPullRequest {
  id: number
  number: number
  title: string
  body: string | null
  merged_at: string | null
  user?: {
    login: string
    avatar_url?: string
  } | null
  html_url: string
  additions?: number
  deletions?: number
  changed_files?: number
}

export interface PullRequestCache {
  repositoryId: string
  pullRequests: CachedPullRequest[]
  lastUpdated: string
}

export let prCache: PullRequestCache[] = []

export function cachePullRequests(repositoryId: string, pullRequests: CachedPullRequest[]) {
  const existingIndex = prCache.findIndex(cache => cache.repositoryId === repositoryId)
  const cacheEntry = {
    repositoryId,
    pullRequests,
    lastUpdated: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    prCache[existingIndex] = cacheEntry
  } else {
    prCache.push(cacheEntry)
  }
}

export function getCachedPullRequests(repositoryId: string): CachedPullRequest[] | null {
  const cache = prCache.find(c => c.repositoryId === repositoryId)
  if (!cache) return null
  
  // 10分以内のキャッシュのみ有効
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  if (cache.lastUpdated < tenMinutesAgo) {
    return null
  }
  
  return cache.pullRequests
}