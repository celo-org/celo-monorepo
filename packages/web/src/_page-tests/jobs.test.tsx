import JoinJobsPage from 'pages/jobs'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

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

const positions = [
  {
    id: '12',
    categories: {
      team: 'Test',
      commitment: 'All In',
      location: 'SF',
    },
    text: 'Work',
    hostedUrl: 'example.com',
  },
  {
    id: '13',
    categories: {
      team: 'Test2',
      commitment: 'Chill',
      location: 'NYC',
    },
    text: 'Play',
    hostedUrl: 'example.com',
  },
]

describe('JoinJobsPage', () => {
  describe('with jobs', () => {
    it('renders', () => {
      const tree = renderer.create(<JoinJobsPage positions={positions} />).toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
  describe('without jobs', () => {
    it('renders', () => {
      const tree = renderer.create(<JoinJobsPage positions={[]} />).toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
