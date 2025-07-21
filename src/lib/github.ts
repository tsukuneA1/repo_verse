import { Octokit } from "@octokit/rest"

export function createGitHubClient(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  })
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1
      const isRetryableError = error?.status === 503 || error?.status === 502 || error?.status === 429
      
      if (isLastAttempt || !isRetryableError) {
        throw error
      }
      
      console.log(`Request failed with ${error?.status}, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
      await sleep(delay * Math.pow(2, i)) // Exponential backoff
    }
  }
  
  throw new Error("Max retries exceeded")
}

export async function getRepositoryPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "closed"
) {
  try {
    const data = await retryRequest(async () => {
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state,
        sort: "updated",
        direction: "desc",
        per_page: 50,
      })
      return data
    })

    return data.filter(pr => pr.merged_at !== null)
  } catch (error) {
    console.error("Error fetching pull requests:", error)
    throw error
  }
}

export async function getPullRequestDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    })

    return data
  } catch (error) {
    console.error("Error fetching pull request details:", error)
    throw error
  }
}

export async function getPullRequestFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  try {
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    })

    return data
  } catch (error) {
    console.error("Error fetching pull request files:", error)
    throw error
  }
}

export async function getCommitsForPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  try {
    const { data } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
    })

    return data
  } catch (error) {
    console.error("Error fetching pull request commits:", error)
    throw error
  }
}

export async function getPullRequestsByNumbers(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumbers: number[]
) {
  try {
    const pullRequests = await Promise.all(
      pullNumbers.map(async (pullNumber) => {
        const [prResponse, filesResponse] = await Promise.all([
          retryRequest(async () => octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
          })),
          retryRequest(async () => octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: pullNumber,
          }))
        ])

        return {
          ...prResponse.data,
          files: filesResponse.data
        }
      })
    )

    return pullRequests
  } catch (error) {
    console.error("Error fetching pull requests by numbers:", error)
    throw error
  }
}

export function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error("Invalid GitHub URL")
  }
  
  const [, owner, repo] = match
  return { owner, repo: repo.replace(/\.git$/, "") }
}