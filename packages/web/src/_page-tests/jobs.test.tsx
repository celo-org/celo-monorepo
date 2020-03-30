import JoinJobsPage from 'pages/jobs'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

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
      const tree = renderer
        .create(
          <TestProvider>
            <JoinJobsPage positions={positions} />
          </TestProvider>
        )
        .toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
  describe('without jobs', () => {
    it('renders', () => {
      const tree = renderer
        .create(
          <TestProvider>
            <JoinJobsPage positions={[]} />
          </TestProvider>
        )
        .toJSON()
      expect(tree).toMatchSnapshot()
    })
  })
})
