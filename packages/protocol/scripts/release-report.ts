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

type ReleaseReport = Issue & {
  start: string
  end: string
  epics: Epic[]
  issues: Issue[]
}

const n = '5'
const networks = ['staging', 'alfajores', 'baklava', 'mainnet']

const release_report: ReleaseReport = {
  title: `Celo Core Contracts Release ${n}`,
  description: `Manage rollout of core contracts release ${n}`,
  start: 'July 12, 2021',
  end: 'August 23, 2021',
  epics: [
    {
      title: `Scope and Audit release ${n}`,
      description: '',
      issues: [
        { title: `Deliver frozen audit ${n + 1} scope to OpenZeppelin`, estimate: 1 },
        { title: `Facilitate audit ${n + 1} and answer questions`, estimate: 1 },
        { title: `Triage audit ${n + 1} issues`, estimate: 1 },
        {
          title: `Resolve audit ${n + 1} issues and tag release 'core-contracts.v${n}'`,
          estimate: 5,
        },
        { title: `Merge release ${n} to master`, estimate: 1 },
      ],
    },
    {
      title: `Communicate and Document release ${n}`,
      description: '',
      issues: [
        { title: `Draft and publish release notes for release ${n}`, estimate: 1 },
        { title: `Draft and publish CGP for release ${n}`, estimate: 1 },
        { title: `Draft and publish forum post for release ${n}`, estimate: 1 },
        { title: `Discuss release ${n} on governance community call`, estimate: 1 },
      ],
    },
    {
      title: `Test and Deploy release ${n}`,
      description: '',
      issues: networks.map((network) => ({
        title: `Deploy release ${n} on ${network}, shepherd through governance, and run env-tests`,
        estimate: 1,
      })),
    },
  ],
  issues: [],
}

const req = (
  url_prefix: string,
  headers: Record<string, string>,
  base_query?: URLSearchParams
) => async (method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, params: Record<string, any>) => {
  const options = { method, headers, body: undefined }
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

const issue_labels = ['Component: Contracts', 'audit', 'CAP']
const gh_org = 'celo-org'
const gh_repo = 'celo-monorepo'

const github_req = req(`https://api.github.com/repos/${gh_org}/${gh_repo}`, {
  Authorization: `token ${process.env.GITHUB_PAT ?? ''}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
})

const repo_id = '197642503'
const workspace_id = '600598462807be0011921c65'

const zenhub_req = req(
  'https://api.zenhub.com/p1',
  {
    'X-Authentication-Token': process.env.ZENHUB_API_KEY ?? '',
    'Content-Type': 'application/json',
  },
  new URLSearchParams({ repo_id, workspace_id })
)

const convertGithubToZenhubIssues = (githubIssues: Array<any>) =>
  githubIssues.map((gh_issue) => ({
    repo_id: parseInt(repo_id),
    issue_number: parseInt(gh_issue.number),
  }))

const main = async (releaseReport: ReleaseReport): Promise<void> => {
  // create release
  const newReport = await zenhub_req('POST', `repositories/${repo_id}/reports/release`, {
    title: releaseReport.title,
    description: releaseReport.description,
    start_date: new Date(releaseReport.start).toISOString(),
    desired_end_date: new Date(releaseReport.end).toISOString(),
    repositories: [parseInt(repo_id)],
  })

  // create epics
  const gh_epics = await concurrentMap(1, releaseReport.epics, async (epic) => {
    // create github issue representing epic
    const gh_epic = await github_req('POST', 'issues', {
      title: epic.title,
      body: epic.description,
      labels: issue_labels,
    })

    // create github issues representing epic contents
    const gh_issues = await concurrentMap(1, epic.issues, (issue) =>
      github_req('POST', 'issues', { title: issue.title, labels: issue_labels })
    )
    const zh_issues = convertGithubToZenhubIssues(gh_issues)

    // assign estimates to github issues
    await concurrentMap(1, zh_issues, (zh_issue, i) =>
      zenhub_req('PUT', `repositories/${repo_id}/issues/${zh_issue.issue_number}/estimate`, {
        estimate: epic.issues[i].estimate,
      })
    )

    // convert github issue to epic and add contents
    await zenhub_req('POST', `repositories/${repo_id}/issues/${gh_epic.number}/convert_to_epic`, {
      issues: zh_issues,
    })

    // add issues to release report
    await zenhub_req('PATCH', `reports/release/${newReport.release_id}/issues`, {
      add_issues: zh_issues,
      remove_issues: [],
    })

    return gh_epic
  })

  const zh_epics = convertGithubToZenhubIssues(gh_epics)
  // add epics to release report
  await zenhub_req('PATCH', `reports/release/${newReport.release_id}/issues`, {
    add_issues: zh_epics,
    remove_issues: [],
  })
}

main(release_report).catch((error) => console.error(error))
