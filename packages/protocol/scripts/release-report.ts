import { generateReleaseReport, ReleaseReport } from '@celo/dev-utils/lib/release-report'

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

generateReleaseReport(
  { labels: ['Component: Contracts', 'audit', 'CAP'], org: 'celo-org', repo: 'celo-monorepo' },
  { repo_id: '197642503', workspace_id: '600598462807be0011921c65' },
  release_report
).catch((error) => console.error(error))
