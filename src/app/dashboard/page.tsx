"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Repo-Verse</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                こんにちは、{session.user?.name}さん
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                サインアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* リポジトリ管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                リポジトリ管理
              </h3>
              <p className="text-gray-600 mb-4">
                監視したいGitHubリポジトリを登録・管理できます
              </p>
              <Link
                href="/repos"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 inline-block"
              >
                リポジトリを管理
              </Link>
            </div>

            {/* 記事生成 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                記事生成
              </h3>
              <p className="text-gray-600 mb-4">
                Pull Requestから魅力的な記事をAIで自動生成
              </p>
              <Link
                href="/repos"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block"
              >
                記事を作成
              </Link>
            </div>

            {/* 公開済み記事 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                公開済み記事
              </h3>
              <p className="text-gray-600 mb-4">
                これまでに公開した記事の閲覧・編集
              </p>
              <button
                disabled
                className="bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed inline-block"
              >
                準備中
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}