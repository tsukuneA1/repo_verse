"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Repository {
  id: string
  name: string
  url: string
  createdAt: string
}

export default function ReposPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchRepositories()
  }, [session, status, router])

  const fetchRepositories = async () => {
    try {
      const response = await fetch("/api/repos")
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories || [])
      }
    } catch (error) {
      console.error("Error fetching repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const addRepository = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRepoUrl.trim()) return

    setAdding(true)
    try {
      console.log("Sending request to add repository:", newRepoUrl)
      const response = await fetch("/api/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: newRepoUrl }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        setRepositories([data.repository, ...repositories])
        setNewRepoUrl("")
        alert("リポジトリを追加しました！")
      } else {
        alert(`リポジトリの追加に失敗しました: ${data.error || "不明なエラー"}`)
      }
    } catch (error) {
      console.error("Error adding repository:", error)
      alert(`エラーが発生しました: ${error}`)
    } finally {
      setAdding(false)
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
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ダッシュボード
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
            <h1 className="text-2xl font-bold text-gray-900">リポジトリ管理</h1>
            <p className="mt-2 text-gray-600">
              監視したいGitHubリポジトリを登録してください
            </p>
          </div>

          {/* リポジトリ追加フォーム */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              新しいリポジトリを追加
            </h2>
            <form onSubmit={addRepository} className="flex gap-4">
              <input
                type="url"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={adding}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? "追加中..." : "追加"}
              </button>
            </form>
          </div>

          {/* リポジトリ一覧 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                登録済みリポジトリ ({repositories.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {repositories.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  まだリポジトリが登録されていません
                </div>
              ) : (
                repositories.map((repo) => (
                  <div key={repo.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{repo.name}</h3>
                      <p className="text-sm text-gray-500">{repo.url}</p>
                      <p className="text-xs text-gray-400">
                        追加日: {new Date(repo.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <Link
                      href={`/repos/${repo.id}/pulls`}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      PRを見る
                    </Link>
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