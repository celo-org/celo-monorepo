import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import MobileMenu from 'src/shared/MobileMenu'

describe('Main MobileMenu', () => {
  it('renders', () => {
    const tree = renderer.create(
      <TestProvider>
        <MobileMenu currentPage="/" />
      </TestProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
