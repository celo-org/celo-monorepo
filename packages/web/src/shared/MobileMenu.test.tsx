import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import menu, { MAIN_MENU } from 'src/shared/menu-items'
import MobileMenu from 'src/shared/MobileMenu'

describe('Main MobileMenu', () => {
  it('renders', () => {
    const tree = renderer.create(
      <TestProvider>
        <MobileMenu currentPage="/" menu={[menu.HOME, ...MAIN_MENU]} />
      </TestProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
