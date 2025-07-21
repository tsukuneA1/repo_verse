import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getArticlesByUserId } from "@/lib/storage"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const articles = getArticlesByUserId(session.user.id)

    return NextResponse.json({
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        repositoryName: article.repositoryName,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        pullRequestIds: article.pullRequestIds
      }))
    })

  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json(
      { error: "記事の取得中にエラーが発生しました" },
      { status: 500 }
    )
  }
}