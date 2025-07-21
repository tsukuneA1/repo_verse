import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { parseGitHubUrl } from "@/lib/github"
import { authOptions } from "@/lib/auth"
import { getRepositoriesByUserId, addRepository } from "@/lib/storage"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRepos = getRepositoriesByUserId(session.user.id)

    return NextResponse.json({ repositories: userRepos })

  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/repos called ===")
    const session = await getServerSession(authOptions)
    console.log("Session:", session)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("User ID:", session.user.id)

    const { url } = await request.json()
    console.log("Received URL:", url)

    if (!url) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    try {
      // GitHub URLを検証・パース
      const { owner, repo: repoName } = parseGitHubUrl(url)
      const name = `${owner}/${repoName}`
      console.log("Parsed repo:", { owner, repoName, name })

      // リポジトリを作成
      const repository = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        name,
        owner,
        userId: session.user.id,
        createdAt: new Date().toISOString()
      }

      addRepository(repository)
      console.log("Repository created:", repository)

      return NextResponse.json({ repository })
    } catch (parseError) {
      console.error("URL parse error:", parseError)
      return NextResponse.json({ error: "Invalid GitHub URL format" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error creating repository:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}