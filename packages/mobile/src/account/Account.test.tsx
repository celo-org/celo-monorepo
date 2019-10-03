const { mockNavigationServiceFor } = require('test/utils')
const { navigate } = mockNavigationServiceFor('Account')

import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Account from 'src/account/Account'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

jest.useFakeTimers()

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Account', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Account />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when Edit Profile Pressed', () => {
    it('navigates to Profile', () => {
      const account = render(
        <Provider store={createMockStore()}>
          <Account />
        </Provider>
      )

      fireEvent.press(account.getByTestId('editProfileButton'))
      expect(navigate).toBeCalledWith(Screens.Profile)
    })
  })

  describe('when dev mode active', () => {
    it('renders correctly', () => {
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
})
