import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import CeloDollarsOverview from 'src/home/CeloDollarsOverview'
import { createMockStore } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('CeloDollarsOverview', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <CeloDollarsOverview />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
