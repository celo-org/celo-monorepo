export interface LeverJob {
  id: string
  categories: {
    team: string
    commitment: string
    location: string
  }
  text: string
  hostedUrl: string
}

type ByTeam = Record<string, LeverJob[]>

export default async function fetchLeverJobs() {
  const res = await fetch('https://api.lever.co/v0/postings/celo?mode=json')
  const json: LeverJob[] = await res.json()

  return json
}

export function groupByTeam(jobs: LeverJob[]): ByTeam {
  return jobs.reduce((groups, current) => {
    groups[current.categories.team] = groups[current.categories.team] || []
    groups[current.categories.team].push(current)
    return groups
  }, {})
}

export function filterLocation(jobs: LeverJob[], locations: Set<string>): LeverJob[] {
  if (locations.size === 0) {
    return jobs
  }
  const locationFilter = (job: LeverJob) => locations.has(job.categories.location)
  return jobs.filter(locationFilter)
}

export function filterDept(jobs: LeverJob[], depts: Set<string>): LeverJob[] {
  if (depts.size === 0) {
    return jobs
  }
  const teamFilter = (job: LeverJob) => depts.has(job.categories.team)
  return jobs.filter(teamFilter)
}

export function filterCommitment(jobs: LeverJob[], commitments: Set<string>): LeverJob[] {
  if (commitments.size === 0) {
    return jobs
  }
  const filter = (job: LeverJob) => commitments.has(job.categories.commitment)
  return jobs.filter(filter)
}

export function sortJobs(jobs: LeverJob[]): LeverJob[] {
  return jobs.sort((job0: LeverJob, job1: LeverJob) => sortOrder(job0, job1))
}

const PRECEDENCE = ['text', 'team', 'location', 'commitment']

function sortOrder(job0: LeverJob, job1: LeverJob, level = 0) {
  const sortingBy = PRECEDENCE[level]
  if (sortField(job0, sortingBy) > sortField(job1, sortingBy)) {
    return 1
  } else if (sortField(job0, sortingBy) < sortField(job1, sortingBy)) {
    return -1
  } else if (level < PRECEDENCE.length) {
    sortOrder(job0, job1, level + 1)
  } else {
    return 0
  }
}

function sortField(job: LeverJob, field: string) {
  return field === 'text' ? job.text : job.categories[field]
}
