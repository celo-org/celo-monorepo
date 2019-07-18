import SettingsItem from '@celo/react-components/components/SettingsItem'
import Touchable from '@celo/react-components/components/Touchable'
import { shallow } from 'enzyme'
import * as React from 'react'

describe('SettingsItem', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const settingsItem = shallow(<SettingsItem onPress={handler} title="SettingsItem" />)
      settingsItem.find(Touchable).simulate('press')
      expect(handler).toBeCalled()
    })
  })
  it('renders with minimum props', () => {
    const settingsItem = shallow(<SettingsItem onPress={jest.fn()} title="SettingsItem" />)
    expect(
      settingsItem
        .find('Text')
        .children()
        .text()
    ).toEqual('SettingsItem')
  })
})
