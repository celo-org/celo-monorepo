import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Account from 'src/account/Account'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

const mockRoute = {
  name: Screens.Account as Screens.Account,
  key: '1',
  params: {},
}

describe('Account', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Account
          // @ts-ignore
          navigation={mockNavigation}
          route={mockRoute}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when dev mode active', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: {
            devModeActive: true,
          },
        })}
      >
        <Account
          // @ts-ignore
          navigation={mockNavigation}
          route={mockRoute}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
