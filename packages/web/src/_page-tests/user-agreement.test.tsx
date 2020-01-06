import * as React from 'react'
import * as renderer from 'react-test-renderer'
import UserAgreement from 'pages/user-agreement'

describe('UserAgreement', () => {
  it('renders', () => {
    const tree = renderer.create(<UserAgreement />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
