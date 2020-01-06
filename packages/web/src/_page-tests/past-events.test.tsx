import * as React from 'react'
import * as renderer from 'react-test-renderer'
import PastEventsPage from '../../pages/past-events'

describe('PastEventsPage', () => {
  it('renders', () => {
    const tree = renderer.create(<PastEventsPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
