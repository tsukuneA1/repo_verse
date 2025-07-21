"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PullRequest {
  id: number
  number: number
  title: string
  body: string | null
  merged_at: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
}

interface Repository {
  id: string
  name: string
  url: string
}

export default function PullsPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repository, setRepository] = useState<Repository | null>(null)
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [selectedPRs, setSelectedPRs] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // paramsを展開
  const { repoId } = use(params)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchPullRequests()
  }, [session, status, router, repoId])

  const fetchPullRequests = async () => {
    try {
      const response = await fetch(`/api/repos/${repoId}/pulls`)
      if (response.ok) {
        const data = await response.json()
        setRepository(data.repository)
        setPullRequests(data.pullRequests || [])
      } else {
        alert("PRの取得に失敗しました")
      }
    } catch (error) {
      console.error("Error fetching pull requests:", error)
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const togglePRSelection = (prId: number) => {
    setSelectedPRs(prev => 
      prev.includes(prId) 
        ? prev.filter(id => id !== prId)
        : [...prev, prId]
    )
  }

  const generateArticle = async () => {
    if (selectedPRs.length === 0) {
      alert("記事を生成するPRを選択してください")
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pullRequestIds: selectedPRs,
          repositoryName: repository?.name || "Unknown Repository"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // 記事編集画面にリダイレクト（データをクエリパラメータで渡す）
        const searchParams = new URLSearchParams({
          title: data.title,
          content: data.content,
          repoId: repoId
        })
        router.push(`/articles/new?${searchParams.toString()}`)
      } else {
        alert("記事の生成に失敗しました")
      }
    } catch (error) {
      console.error("Error generating article:", error)
      alert("エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold">
                Repo-Verse
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/repos" className="text-gray-600 hover:text-gray-900">
                リポジトリ一覧
              </Link>
              <span className="text-sm text-gray-700">
                {session?.user?.name}さん
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {repository?.name} - Pull Requests
            </h1>
            <p className="mt-2 text-gray-600">
              記事にしたいPull Requestを選択してください
            </p>
          </div>

          {/* 選択状態と生成ボタン */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">
                  選択中: {selectedPRs.length} 件のPR
                </span>
              </div>
              <button
                onClick={generateArticle}
                disabled={selectedPRs.length === 0 || generating}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? "記事を生成中..." : "記事を生成"}
              </button>
            </div>
          </div>

          {/* PR一覧 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                マージ済みPull Requests ({pullRequests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pullRequests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  マージ済みのPRが見つかりませんでした
                </div>
              ) : (
                pullRequests.map((pr) => (
                  <div key={pr.id} className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedPRs.includes(pr.id)}
                        onChange={() => togglePRSelection(pr.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            #{pr.number} {pr.title}
                          </h3>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Merged
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>by {pr.user.login}</span>
                          {pr.merged_at && (
                            <span>
                              merged {new Date(pr.merged_at).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                        {pr.body && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {pr.body.substring(0, 200)}...
                          </p>
                        )}
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          GitHubで見る →
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}