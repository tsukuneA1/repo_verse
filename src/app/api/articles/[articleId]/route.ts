import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getArticleById } from "@/lib/storage"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const article = getArticleById(articleId)
    
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // ユーザーのアクセス権限チェック
    if (article.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ article })

  } catch (error) {
    console.error("Error fetching article:", error)
    return NextResponse.json(
      { error: "記事の取得中にエラーが発生しました" },
      { status: 500 }
    )
  }
}