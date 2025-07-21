import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { generateArticleFromPRs, generateArticleTitle, type PullRequestData } from "@/lib/openai"
import { authOptions } from "@/lib/auth"
import { addArticle, getRepositoryById, getCachedPullRequests } from "@/lib/storage"
import { createGitHubClient, getPullRequestsByNumbers, parseGitHubUrl } from "@/lib/github"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pullRequestIds, repositoryName, repositoryId, customPrompt } = await request.json()

    if (!pullRequestIds || !Array.isArray(pullRequestIds) || pullRequestIds.length === 0) {
      return NextResponse.json({ error: "Pull request IDs are required" }, { status: 400 })
    }

    if (!repositoryName) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    // リポジトリ情報の取得
    let repoOwner: string, repoName: string
    
    if (repositoryId) {
      const repository = getRepositoryById(repositoryId)
      if (!repository) {
        return NextResponse.json({ error: "Repository not found" }, { status: 404 })
      }
      
      // ユーザーのアクセス権限チェック
      if (repository.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      
      const parsed = parseGitHubUrl(repository.url)
      repoOwner = parsed.owner
      repoName = parsed.repo
    } else {
      // repositoryIdがない場合のフォールバック（従来の動作）
      // repositoryNameが "owner/repo" 形式の場合は分割して使用
      if (repositoryName.includes('/')) {
        const parts = repositoryName.split('/')
        repoOwner = parts[0]
        repoName = parts[1]
      } else {
        return NextResponse.json({ error: "Repository ID or owner/repo format required" }, { status: 400 })
      }
    }

    // GitHub APIでセッションからアクセストークンを取得
    const accessToken = session.accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "GitHub access token not found" }, { status: 401 })
    }

    // まずキャッシュからPR情報を取得を試行
    let cachedPRs = repositoryId ? getCachedPullRequests(repositoryId) : null
    
    if (cachedPRs) {
      console.log("Using cached PR data")
      // キャッシュからIDに基づいて該当するPRを取得
      const selectedPRs = cachedPRs.filter(pr => 
        pullRequestIds.some(id => pr.id.toString() === id.toString())
      )
      
      if (selectedPRs.length > 0) {
        const pullRequestsData = selectedPRs
        
        // PullRequestData型に変換
        const formattedPRs: PullRequestData[] = pullRequestsData.map(pr => ({
          title: pr.title,
          body: pr.body,
          number: pr.number,
          merged_at: pr.merged_at,
          user: pr.user,
          html_url: pr.html_url,
          additions: pr.additions,
          deletions: pr.deletions,
          changed_files: pr.changed_files
        }))
        
        // 記事生成に進む
        const content = await generateArticleFromPRs(formattedPRs, repositoryName, customPrompt)
        const title = await generateArticleTitle(content)
        
        // 記事をストレージに保存
        const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()
        
        const article = {
          id: articleId,
          title,
          content,
          repositoryId: repositoryId || `repo_${repositoryName}_${Date.now()}`,
          repositoryName,
          userId: session.user.id,
          pullRequestIds,
          createdAt: now,
          updatedAt: now
        }
        
        addArticle(article)
        
        return NextResponse.json({
          articleId: article.id,
          title,
          content,
          pullRequests: formattedPRs
        })
      }
    }

    // キャッシュにない場合は GitHub APIから取得（フォールバック）
    console.log("No cached data found, falling back to GitHub API")
    const octokit = createGitHubClient(accessToken)
    
    // pullRequestIdsはPRのIDなので、まずリポジトリの全PRを取得してIDからnumberを特定する
    console.log("Fetching all PRs to map IDs to numbers...")
    const { getRepositoryPullRequests } = await import("@/lib/github")
    const allPRs = await getRepositoryPullRequests(octokit, repoOwner, repoName, "all")
    
    // IDからnumberにマッピング
    const prNumbers: number[] = []
    for (const prId of pullRequestIds) {
      const pr = allPRs.find(p => p.id.toString() === prId.toString())
      if (pr) {
        prNumbers.push(pr.number)
      } else {
        console.warn(`PR with ID ${prId} not found`)
      }
    }
    
    if (prNumbers.length === 0) {
      return NextResponse.json({ error: "No valid pull requests found" }, { status: 400 })
    }

    console.log(`Found PR numbers: ${prNumbers.join(', ')}`)
    const pullRequestsData = await getPullRequestsByNumbers(octokit, repoOwner, repoName, prNumbers)
    
    // PullRequestData型に変換
    const formattedPRs: PullRequestData[] = pullRequestsData.map(pr => ({
      title: pr.title,
      body: pr.body,
      number: pr.number,
      merged_at: pr.merged_at,
      user: pr.user,
      html_url: pr.html_url,
      files: pr.files,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files
    }))

    // OpenAI APIで記事を生成
    const content = await generateArticleFromPRs(formattedPRs, repositoryName, customPrompt)
    const title = await generateArticleTitle(content)

    // 記事をストレージに保存
    const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const article = {
      id: articleId,
      title,
      content,
      repositoryId: repositoryId || `repo_${repositoryName}_${Date.now()}`,
      repositoryName,
      userId: session.user.id,
      pullRequestIds,
      createdAt: now,
      updatedAt: now
    }

    addArticle(article)

    return NextResponse.json({
      articleId: article.id,
      title,
      content,
      pullRequests: formattedPRs
    })

  } catch (error) {
    console.error("Error generating article:", error)
    return NextResponse.json(
      { error: "記事の生成中にエラーが発生しました" },
      { status: 500 }
    )
  }
}