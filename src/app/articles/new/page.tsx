"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export default function NewArticlePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    // URLパラメータから初期データを取得
    const initialTitle = searchParams.get("title")
    const initialContent = searchParams.get("content")
    
    if (initialTitle) setTitle(initialTitle)
    if (initialContent) setContent(initialContent)
  }, [session, status, router, searchParams])

  const saveArticle = async (published: boolean = false) => {
    if (!title.trim() || !content.trim()) {
      alert("タイトルと内容を入力してください")
      return
    }

    setSaving(true)
    try {
      // 実際のプロジェクトではここでAPIを呼び出して記事を保存
      console.log("Saving article:", { title, content, published })
      
      // サンプル実装：保存成功をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (published) {
        alert("記事を公開しました！")
        router.push("/dashboard")
      } else {
        alert("下書きを保存しました")
      }
    } catch (error) {
      console.error("Error saving article:", error)
      alert("保存中にエラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") {
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">記事を編集</h1>
            <p className="mt-2 text-gray-600">
              AIが生成した記事を自由に編集してください
            </p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">記事エディター</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => saveArticle(false)}
                    disabled={saving}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "下書き保存"}
                  </button>
                  <button
                    onClick={() => saveArticle(true)}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "公開中..." : "公開"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* タイトル入力 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="記事のタイトルを入力してください"
                />
              </div>

              {/* 内容入力 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <textarea
                  id="content"
                  rows={20}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="記事の内容を入力してください"
                />
              </div>

              {/* プレビュー */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h3>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[200px]">
                  <h2 className="text-xl font-bold mb-4">{title || "タイトルなし"}</h2>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{content || "内容がありません"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}