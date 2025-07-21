"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"

interface Article {
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

export default function ArticlePage() {
  const { data: session, status } = useSession()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const articleId = params.articleId as string

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchArticle()
  }, [session, status, router, articleId])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("記事が見つかりません")
        }
        throw new Error("記事の取得に失敗しました")
      }
      
      const data = await response.json()
      setArticle(data.article)
    } catch (error) {
      console.error("Error fetching article:", error)
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
          <div className="text-center">
            <div className="text-red-600 mb-4">エラー: {error}</div>
            <Link 
              href="/articles"
              className="text-blue-600 hover:underline"
            >
              記事一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">記事が見つかりません</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/articles"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 記事一覧に戻る
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-4">
              <div className="flex items-center space-x-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {article.repositoryName}
                </span>
                <span>{article.pullRequestIds.length} 件のPRから生成</span>
              </div>
              <div className="flex flex-col items-end">
                <span>作成: {new Date(article.createdAt).toLocaleDateString("ja-JP")}</span>
                {article.updatedAt !== article.createdAt && (
                  <span>更新: {new Date(article.updatedAt).toLocaleDateString("ja-JP")}</span>
                )}
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>
              {article.content}
            </ReactMarkdown>
          </div>
        </article>

        <div className="mt-8 flex justify-center">
          <Link
            href="/articles"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            記事一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}