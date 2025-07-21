"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Article {
  id: string
  title: string
  repositoryName: string
  createdAt: string
  updatedAt: string
  pullRequestIds: string[]
}

export default function ArticlesPage() {
  const { data: session, status } = useSession()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchArticles()
  }, [session, status, router])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/articles")
      
      if (!response.ok) {
        throw new Error("記事の取得に失敗しました")
      }
      
      const data = await response.json()
      setArticles(data.articles)
    } catch (error) {
      console.error("Error fetching articles:", error)
      setError(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-red-600">エラー: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">記事一覧</h1>
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ダッシュボードに戻る
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">まだ記事が生成されていません。</p>
            <Link 
              href="/dashboard"
              className="text-blue-600 hover:underline"
            >
              ダッシュボードで記事を生成する
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <div 
                key={article.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {article.repositoryName}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {article.pullRequestIds.length} 件のPR
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    href={`/articles/${article.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    記事を読む
                  </Link>
                  
                  {article.updatedAt !== article.createdAt && (
                    <span className="text-xs text-gray-500">
                      更新: {new Date(article.updatedAt).toLocaleDateString("ja-JP")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}