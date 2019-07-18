const { mockNavigationServiceFor } = require('test/utils')
const { navigate } = mockNavigationServiceFor('Profile')
import { shallow } from 'enzyme'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Profile from 'src/account/Profile'
import SettingsItem from 'src/account/SettingsItem'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

function profileFactory() {
  return (
    <Provider store={createMockStore({})}>
      <Profile navigation={mockNavigation} />
    </Provider>
  )
}

describe('Profile', () => {
  it('renders correctly', () => {
    const tree = renderer.create(profileFactory())
    expect(tree).toMatchSnapshot()
  })

  describe('when SettingsItem pressed', () => {
    it('goes to Edit Profile Screen', () => {
      const profile = shallow(profileFactory())
        .dive()
        .dive()
        .dive()
      profile.find(SettingsItem).simulate('press')
      expect(navigate).toBeCalledWith(Screens.EditProfile)
    })
  })
})
