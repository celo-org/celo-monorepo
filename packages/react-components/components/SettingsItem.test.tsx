import {
  SettingsItemInput,
  SettingsItemSwitch,
  SettingsItemTextValue,
} from '@celo/react-components/components/SettingsItem'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'

const title = 'title'
const testID = 'testID'

describe('SettingsItemTextValue', () => {
  const value = 'value'
  it('renders correctly without value', () => {
    const wrapper = render(<SettingsItemTextValue title={title} />)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const wrapper = render(<SettingsItemTextValue title={title} value={value} />)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <SettingsItemTextValue testID={testID} title={title} value={value} onPress={onPress} />
    )
    fireEvent.press(getByTestId(testID))
    expect(onPress).toHaveBeenCalled()
  })
})

describe('SettingsItemSwitch', () => {
  const value = true
  const onValueChange = jest.fn()
  it('renders correctly', () => {
    const wrapper = render(
      <SettingsItemSwitch title={title} value={value} onValueChange={onValueChange} />
    )
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const { getByTestId } = render(
      <SettingsItemSwitch
        testID={testID}
        title={title}
        value={value}
        onValueChange={onValueChange}
      />
    )
    fireEvent(getByTestId(testID), 'valueChange', !value)
    expect(onValueChange).toHaveBeenCalledWith(!value)
  })
})

describe('SettingsItemInput', () => {
  const value = 'value'
  const newValue = 'newValue'
  const onValueChange = jest.fn()
  it('renders correctly', () => {
    const wrapper = render(
      <SettingsItemInput onValueChange={onValueChange} title={title} value={value} />
    )
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const { getByTestId } = render(
      <SettingsItemInput
        testID={testID}
        title={title}
        value={value}
        onValueChange={onValueChange}
      />
    )
    fireEvent(getByTestId(testID), 'valueChange', newValue)
    expect(onValueChange).toHaveBeenCalledWith(newValue)
  })
})
