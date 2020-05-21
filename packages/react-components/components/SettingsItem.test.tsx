import SettingsItem from '@celo/react-components/components/SettingsItem'
import Touchable from '@celo/react-components/components/Touchable'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'

describe('SettingsItem', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByType } = render(<SettingsItem onPress={handler} title="SettingsItem" />)
      fireEvent.press(getByType(Touchable))
      expect(handler).toHaveBeenCalled()
    })
  })
  it('renders with minimum props', () => {
    const { getByText } = render(<SettingsItem onPress={jest.fn()} title="SettingsItem" />)
    expect(getByText('SettingsItem')).toBeTruthy()
  })
})
