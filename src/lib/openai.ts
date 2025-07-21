import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PullRequestData {
  title: string
  body: string | null
  number: number
  merged_at: string | null
  user?: {
    login: string
    avatar_url?: string
  } | null
  html_url: string
  files?: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    patch?: string
  }>
  commits_count?: number
  additions?: number
  deletions?: number
  changed_files?: number
}

export async function generateArticleFromPRs(
  pullRequests: PullRequestData[],
  repositoryName: string,
  customPrompt?: string
): Promise<string> {
  if (pullRequests.length === 0) {
    throw new Error("No pull requests provided")
  }

  const prSummaries = pullRequests.map(pr => {
    const body = pr.body ? pr.body.substring(0, 300) + "..." : "No description"
    const author = pr.user?.login || "Unknown"
    
    // ファイル変更情報の作成
    const filesInfo = pr.files ? pr.files.map(file => {
      const status = file.status === 'added' ? '新規作成' : 
                    file.status === 'modified' ? '変更' :
                    file.status === 'deleted' ? '削除' : file.status
      return `  - ${file.filename} (${status}: +${file.additions}行, -${file.deletions}行)`
    }).join('\n') : ""
    
    const changesInfo = pr.additions || pr.deletions ? 
      `- 変更量: +${pr.additions || 0}行追加, -${pr.deletions || 0}行削除, ${pr.changed_files || 0}ファイル変更\n` : ""
    
    return `
## PR #${pr.number}: ${pr.title}
- 作成者: ${author}
- マージ日: ${pr.merged_at ? new Date(pr.merged_at).toLocaleDateString('ja-JP') : '未マージ'}
- 内容: ${body}
${changesInfo}${filesInfo ? `- 変更ファイル:\n${filesInfo}` : ""}
- URL: ${pr.html_url}
`
  }).join('\n')

  const defaultPrompt = `
あなたは技術ブログライターです。以下のGitHubリポジトリ「${repositoryName}」のPull Request情報を元に、
簡潔で分かりやすい技術記事を書いてください。

【要件】
- 日本語で書いてください
- 簡潔で分かりやすい文体で書いてください
- 技術的な内容を具体的に説明してください
- 1000文字程度で書いてください
- 各PRの変更内容を明確に説明してください
- 事実に基づいて書いてください

【Pull Request情報】
${prSummaries}
`

  const prompt = customPrompt ? `
以下のGitHubリポジトリ「${repositoryName}」のPull Request情報を元に記事を書いてください。

【カスタム要件】
${customPrompt}

【Pull Request情報】
${prSummaries}
` : defaultPrompt

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは技術ブログの専門ライターです。GitHubのPull Request情報から、ユーザーの要件に沿った技術記事を作成します。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "記事の生成に失敗しました。"
  } catch (error) {
    console.error("Error generating article:", error)
    throw new Error("記事の生成中にエラーが発生しました。")
  }
}

export async function generateArticleTitle(content: string): Promise<string> {
  const prompt = `
以下の技術記事の内容から、魅力的なタイトルを生成してください。

【要件】
- 30文字以内
- 読み手の興味を引く
- 内容を適切に表現する
- 日本語で書く

【記事内容】
${content.substring(0, 500)}...
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "技術記事のタイトル"
  } catch (error) {
    console.error("Error generating title:", error)
    return "技術記事のタイトル"
  }
}