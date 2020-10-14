import { EventProps } from 'fullstack/EventProps'
import PastEventsPage from 'pages/past-events'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

const PAST: EventProps[] = [
  {
    name: 'Test',
    startDate: '2000-01-01',
    location: 'SouthPole, Antarctica',
    celoHosted: true,
    celoSpeaking: true,
  },
  {
    name: 'Mythos',
    startDate: '2001-01-01',
    location: 'Atlantis, Atlantis',
    celoHosted: false,
    celoSpeaking: true,
  },
]

describe('PastEventsPage', () => {
  beforeEach(() => {
    global.fetch.mockResponseOnce(JSON.stringify({ pastEvents: PAST }))
  })
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <PastEventsPage />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
