const { mockNavigationServiceFor } = require('test/utils')
const { navigate } = mockNavigationServiceFor('Profile')
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import Profile from 'src/account/Profile'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

function profileFactory() {
  return (
    <Provider store={createMockStore({})}>
      <Profile navigation={mockNavigation} />
    </Provider>
  )
}

describe('Profile', () => {
  it('renders correctly', () => {
    const { toJSON } = render(profileFactory())
    expect(toJSON()).toMatchSnapshot()
  })

  describe('when SettingsItem pressed', () => {
    it('goes to Edit Profile Screen', () => {
      const { getByTestId } = render(profileFactory())

      fireEvent.press(getByTestId('ProfileEditName'))
      expect(navigate).toBeCalledWith(Screens.EditProfile)
    })
  })
})
