"use client"

import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard")
      } else {
        setLoading(false)
      }
    })
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Repo-Verse にサインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            GitHubアカウントでログインしてください
          </p>
        </div>
        <div>
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            GitHubでサインイン
          </button>
        </div>
      </div>
    </div>
  )
}