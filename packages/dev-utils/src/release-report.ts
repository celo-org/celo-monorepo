import { concurrentMap } from '@celo/base'
import fetch from 'node-fetch'

type Issue = {
  title: string
  description?: string
  estimate?: number
}

type Epic = Issue & {
  issues: Issue[]
}

export type ReleaseReport = Issue & {
  start: string
  end: string
  epics: Epic[]
  issues: Issue[]
}

export type GithubConfig = {
  labels: string[]
  org: string
  repo: string
}

export type ZenhubConfig = {
  repo_id: string
  workspace_id: string
}

const req = (
  url_prefix: string,
  headers: Record<string, string>,
  base_query?: URLSearchParams
) => async (method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, params: Record<string, any>) => {
  const options = { method, headers, body: '' }
  let full_url = `${url_prefix}/${url}?${(base_query ?? '').toString()}`

  if (method === 'GET') {
    full_url += new URLSearchParams(params).toString()
  } else {
    options.body = JSON.stringify(params)
  }

  const resp = await fetch(full_url, options)
  if (!resp.ok) {
    throw new Error(
      `Request failed: ${method} ${full_url} with ${resp.status} (${resp.statusText})`
    )
  }
  return JSON.parse(await resp.text())
}

const github_req = (gc: GithubConfig) =>
  req(`https://api.github.com/repos/${gc.org}/${gc.repo}`, {
    Authorization: `token ${process.env.GITHUB_PAT ?? ''}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  })

const zenhub_req = (zc: ZenhubConfig) =>
  req(
    'https://api.zenhub.com/p1',
    {
      'X-Authentication-Token': process.env.ZENHUB_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    new URLSearchParams(zc)
  )

const convertGithubToZenhubIssues = (zc: ZenhubConfig) => (githubIssues: Array<any>) =>
  githubIssues.map((gh_issue) => ({
    repo_id: parseInt(zc.repo_id),
    issue_number: parseInt(gh_issue.number),
  }))

export const generateReleaseReport = async (
  githubConfig: GithubConfig,
  zenhubConfig: ZenhubConfig,
  releaseReport: ReleaseReport
): Promise<void> => {
  const zh_req = zenhub_req(zenhubConfig)
  const gh_req = github_req(githubConfig)

  // create release
  const newReport = await zh_req('POST', `repositories/${zenhubConfig.repo_id}/reports/release`, {
    title: releaseReport.title,
    description: releaseReport.description,
    start_date: new Date(releaseReport.start).toISOString(),
    desired_end_date: new Date(releaseReport.end).toISOString(),
    repositories: [parseInt(zenhubConfig.repo_id)],
  })

  // create epics
  const gh_epics = await concurrentMap(1, releaseReport.epics, async (epic) => {
    // create github issue representing epic
    const gh_epic = await gh_req('POST', 'issues', {
      title: epic.title,
      body: epic.description,
      labels: githubConfig.labels,
    })

    // create github issues representing epic contents
    const gh_issues = await concurrentMap(1, epic.issues, (issue) =>
      gh_req('POST', 'issues', { title: issue.title, labels: githubConfig.labels })
    )
    const zh_issues = convertGithubToZenhubIssues(zenhubConfig)(gh_issues)

    // assign estimates to github issues
    await concurrentMap(1, zh_issues, (zh_issue, i) =>
      zh_req(
        'PUT',
        `repositories/${zenhubConfig.repo_id}/issues/${zh_issue.issue_number}/estimate`,
        {
          estimate: epic.issues[i].estimate,
        }
      )
    )

    // convert github issue to epic and add contents
    await zh_req(
      'POST',
      `repositories/${zenhubConfig.repo_id}/issues/${gh_epic.number}/convert_to_epic`,
      {
        issues: zh_issues,
      }
    )

    // add issues to release report
    await zh_req('PATCH', `reports/release/${newReport.release_id}/issues`, {
      add_issues: zh_issues,
      remove_issues: [],
    })

    return gh_epic
  })

  const zh_epics = convertGithubToZenhubIssues(zenhubConfig)(gh_epics)
  // add epics to release report
  await zh_req('PATCH', `reports/release/${newReport.release_id}/issues`, {
    add_issues: zh_epics,
    remove_issues: [],
  })
}
