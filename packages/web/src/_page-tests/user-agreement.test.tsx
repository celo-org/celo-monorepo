import UserAgreement from 'pages/user-agreement'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('UserAgreement', () => {
  it('renders', () => {
    const tree = renderer.create(<UserAgreement />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
