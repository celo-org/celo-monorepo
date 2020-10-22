import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Logo from '../../../pages/experience/brand/logo'

describe('Experience/Logo', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Logo />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
