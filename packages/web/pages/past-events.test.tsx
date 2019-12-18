import * as React from 'react'
import * as renderer from 'react-test-renderer'
import PastEventsPage from './past-events'

describe('PastEventsPage', () => {
  it('renders', () => {
    const tree = renderer.create(<PastEventsPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
