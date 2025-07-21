import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createGitHubClient, getRepositoryPullRequests, parseGitHubUrl } from "@/lib/github"
import { authOptions } from "@/lib/auth"
import { getRepositoryById, cachePullRequests } from "@/lib/storage"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    console.log("PR API endpoint called")
    const { repoId } = await params
    console.log("Repo ID:", repoId)
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // メモリストレージからリポジトリ情報を取得
    const repo = getRepositoryById(repoId)
    
    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    // ユーザーのアクセス権限チェック
    if (repo.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // セッションからアクセストークンを取得
    const accessToken = session.accessToken
    console.log("Access token exists:", !!accessToken)
    
    if (!accessToken) {
      return NextResponse.json({ error: "GitHub access token not found" }, { status: 401 })
    }

    // GitHub URLからオーナーとリポ名を抽出
    const { owner, repo: repoName } = parseGitHubUrl(repo.url)
    console.log("Parsed GitHub URL - Owner:", owner, "Repo:", repoName)

    // GitHub APIでPRを取得
    const octokit = createGitHubClient(accessToken)
    console.log("Fetching pull requests...")
    const pullRequests = await getRepositoryPullRequests(octokit, owner, repoName)
    console.log("Pull requests fetched:", pullRequests.length)
    
    // PRデータをキャッシュに保存
    cachePullRequests(repoId, pullRequests.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      merged_at: pr.merged_at,
      user: pr.user,
      html_url: pr.html_url,
    })))

    return NextResponse.json({
      repository: {
        id: repo.id,
        name: repo.name,
        url: repo.url
      },
      pullRequests: pullRequests.map(pr => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        merged_at: pr.merged_at,
        html_url: pr.html_url,
        user: {
          login: pr.user?.login,
          avatar_url: pr.user?.avatar_url
        }
      }))
    })

  } catch (error) {
    console.error("Error fetching pull requests:", error)
    
    // より詳細なエラー情報を提供
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}