import * as React from 'react'
import * as renderer from 'react-test-renderer'
import DevelopersPage from '../../../pages/developers/index'

describe('DevelopersPage', () => {
  it('renders', () => {
    const tree = renderer.create(<DevelopersPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
