import { LeverJob } from 'src/jobs/lever'
import { filterCommitment, filterDept, filterLocation, groupByTeam, sortJobs } from './lever'

const jobs: LeverJob[] = [
  {
    id: '0',
    categories: {
      team: 'Engineering',
      commitment: 'Full Time',
      location: 'Berlin',
    },
    text: 'Senior Test Dev',
    hostedUrl: '',
  },
  {
    id: '1',
    categories: {
      team: 'Engineering',
      commitment: 'Part Time',
      location: 'Berlin',
    },
    text: 'Junior Test Dev',
    hostedUrl: '',
  },
  {
    id: '2',
    categories: {
      team: 'Engineering',
      commitment: 'Full Time',
      location: 'San Francisco',
    },
    text: 'Senior Test Dev',
    hostedUrl: '',
  },
  {
    id: '3',
    categories: {
      team: 'Design',
      commitment: 'Full Time',
      location: 'San Francisco',
    },
    text: 'Product Designer',
    hostedUrl: '',
  },
  {
    id: '4',
    categories: {
      team: 'Business',
      commitment: 'Part Time',
      location: 'San Francisco',
    },
    text: 'Finance Person',
    hostedUrl: '',
  },
  {
    id: '5',
    categories: {
      team: 'Design',
      commitment: 'Full Time',
      location: 'San Francisco',
    },
    text: 'Product Architect',
    hostedUrl: '',
  },
]

describe('lever', () => {
  describe('@sortJobs', () => {
    it('sorts by title, location, commitment', () => {
      expect(sortJobs(jobs).map(pretty)).toEqual([
        'Finance Person -- San Francisco -- Business -- Part Time',
        'Junior Test Dev -- Berlin -- Engineering -- Part Time',
        'Product Architect -- San Francisco -- Design -- Full Time',
        'Product Designer -- San Francisco -- Design -- Full Time',
        'Senior Test Dev -- Berlin -- Engineering -- Full Time',
        'Senior Test Dev -- San Francisco -- Engineering -- Full Time',
      ])
    })
    it('deep sorts right', () => {
      expect(
        sortJobs([
          {
            id: 'A',
            categories: {
              team: 'BBB',
              commitment: '1',
              location: 'CCC',
            },
            text: 'AAA',
            hostedUrl: '',
          },
          {
            id: 'B',
            categories: {
              team: 'BBB',
              commitment: '2',
              location: 'CCC',
            },
            text: 'AAA',
            hostedUrl: '',
          },
          {
            id: 'C',
            categories: {
              team: 'BBB',
              commitment: '3',
              location: 'CCC',
            },
            text: 'AAA',
            hostedUrl: '',
          },
        ]).map(pretty)
      ).toEqual(['AAA -- CCC -- BBB -- 1', 'AAA -- CCC -- BBB -- 2', 'AAA -- CCC -- BBB -- 3'])
    })
  })
  describe('@filterDept', () => {
    it('filters by department', () => {
      expect(filterDept(jobs, new Set(['Engineering'])).map(pretty)).toEqual([
        'Junior Test Dev -- Berlin -- Engineering -- Part Time',
        'Senior Test Dev -- Berlin -- Engineering -- Full Time',
        'Senior Test Dev -- San Francisco -- Engineering -- Full Time',
      ])
    })
  })
  describe('@filterCommitment', () => {
    it('filters by commitment type', () => {
      expect(filterCommitment(jobs, new Set(['Part Time'])).map(pretty)).toEqual([
        'Finance Person -- San Francisco -- Business -- Part Time',
        'Junior Test Dev -- Berlin -- Engineering -- Part Time',
      ])
    })
  })
  describe('@filterLocation', () => {
    it('filters by location', () => {
      expect(filterLocation(jobs, new Set(['Berlin'])).map(pretty)).toEqual([
        'Junior Test Dev -- Berlin -- Engineering -- Part Time',
        'Senior Test Dev -- Berlin -- Engineering -- Full Time',
      ])
    })
    it('returns empty when none', () => {
      expect(filterLocation(jobs, new Set(['Jordan'])).length).toEqual(0)
    })
  })
  describe('@groupByTeam', () => {
    it('groups by department', () => {
      expect(Object.keys(groupByTeam(jobs))).toEqual(['Business', 'Engineering', 'Design'])
    })
  })
})

function pretty(job: LeverJob) {
  return `${job.text} -- ${job.categories.location} -- ${job.categories.team} -- ${job.categories.commitment}`
}
