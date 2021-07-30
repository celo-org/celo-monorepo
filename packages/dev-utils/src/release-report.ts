import { concurrentMap } from '@celo/base'
import fetch from 'node-fetch'

interface Issue {
  title: string
  description?: string
  estimate?: number
}

interface Epic extends Issue {
  issues: Issue[]
}

export interface ReleaseReport extends Issue {
  start: string
  end: string
  epics: Epic[]
  issues: Issue[]
}

export interface GithubConfig {
  labels: string[]
  org: string
  repo: string
  apiToken: string
}

export interface ZenhubConfig {
  repoId: string
  workspaceId: string
  apiKey: string
}

const fetchWrapper = (
  urlPrefix: string,
  headers: Record<string, string>,
  baseQuery?: URLSearchParams
) => async (method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, params: Record<string, any>) => {
  const options = { method, headers, body: '' }
  let fullUrl = `${urlPrefix}/${url}?${(baseQuery ?? '').toString()}`

  if (method === 'GET') {
    fullUrl += new URLSearchParams(params).toString()
  } else {
    options.body = JSON.stringify(params)
  }

  const resp = await fetch(fullUrl, options)
  if (!resp.ok) {
    throw new Error(
      `fetchWrapperuest failed: ${method} ${fullUrl} with ${resp.status} (${resp.statusText})`
    )
  }
  return JSON.parse(await resp.text())
}

const githubFetch = (gc: GithubConfig) =>
  fetchWrapper(`https://api.github.com/repos/${gc.org}/${gc.repo}`, {
    Authorization: `token ${gc.apiToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  })

const zenhubFetch = (zc: ZenhubConfig) =>
  fetchWrapper(
    'https://api.zenhub.com/p1',
    {
      'X-Authentication-Token': zc.apiKey,
      'Content-Type': 'application/json',
    },
    new URLSearchParams({ repo_id: zc.repoId, workspace_id: zc.workspaceId })
  )

const convertGithubToZenhubIssues = (zc: ZenhubConfig) => (githubIssues: any[]) =>
  githubIssues.map((ghIssue) => ({
    repo_id: parseInt(zc.repoId, 10),
    issue_number: parseInt(ghIssue.number, 10),
  }))

export const generateReleaseReport = async (
  githubConfig: GithubConfig,
  zenhubConfig: ZenhubConfig,
  releaseReport: ReleaseReport
): Promise<void> => {
  const zhFetchWrapper = zenhubFetch(zenhubConfig)
  const ghFetchWrapper = githubFetch(githubConfig)

  // create release
  const newReport = await zhFetchWrapper(
    'POST',
    `repositories/${zenhubConfig.repoId}/reports/release`,
    {
      title: releaseReport.title,
      description: releaseReport.description,
      start_date: new Date(releaseReport.start).toISOString(),
      desired_end_date: new Date(releaseReport.end).toISOString(),
      repositories: [parseInt(zenhubConfig.repoId, 10)],
    }
  )

  // create epics
  const ghEpics = await concurrentMap(1, releaseReport.epics, async (epic) => {
    // create github issue representing epic
    const ghEpic = await ghFetchWrapper('POST', 'issues', {
      title: epic.title,
      body: epic.description,
      labels: githubConfig.labels,
    })

    // create github issues representing epic contents
    const ghIssues = await concurrentMap(1, epic.issues, (issue) =>
      ghFetchWrapper('POST', 'issues', { title: issue.title, labels: githubConfig.labels })
    )
    const zhIssues = convertGithubToZenhubIssues(zenhubConfig)(ghIssues)

    // assign estimates to github issues
    await concurrentMap(1, zhIssues, (zhIssue, i) =>
      zhFetchWrapper(
        'PUT',
        `repositories/${zenhubConfig.repoId}/issues/${zhIssue.issue_number}/estimate`,
        {
          estimate: epic.issues[i].estimate,
        }
      )
    )

    // convert github issue to epic and add contents
    await zhFetchWrapper(
      'POST',
      `repositories/${zenhubConfig.repoId}/issues/${ghEpic.number}/convert_to_epic`,
      {
        issues: zhIssues,
      }
    )

    // add issues to release report
    await zhFetchWrapper('PATCH', `reports/release/${newReport.release_id}/issues`, {
      add_issues: zhIssues,
      remove_issues: [],
    })

    return ghEpic
  })

  const zhEpics = convertGithubToZenhubIssues(zenhubConfig)(ghEpics)
  // add epics to release report
  await zhFetchWrapper('PATCH', `reports/release/${newReport.release_id}/issues`, {
    add_issues: zhEpics,
    remove_issues: [],
  })
}
