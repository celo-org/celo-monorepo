import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Account from 'src/account/Account'
import { createMockStore } from 'test/utils'

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
        <Account />
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
        <Account />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
