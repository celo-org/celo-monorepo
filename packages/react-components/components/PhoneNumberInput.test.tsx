import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Platform } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'

jest.mock('@celo/react-native-sms-retriever', () => {
  return {
    requestPhoneNumber: jest.fn(() => '+49030111111'),
  }
})

describe('PhoneNumberInput', () => {
  describe('when defaultCountry is falsy', () => {
    it('renders an AutoComplete and a country can be selected', () => {
      const mockSetCountryCode = jest.fn()
      const { getByTestId, toJSON } = render(
        <PhoneNumberInput
          defaultCountry={null}
          setE164Number={jest.fn()}
          setIsValidNumber={jest.fn()}
          setCountryCode={mockSetCountryCode}
        />
      )

      expect(toJSON()).toMatchSnapshot()
      const autocomplete = getByTestId('CountryNameField')
      expect(autocomplete).toBeTruthy()
      fireEvent.changeText(autocomplete, 'Canada')
      expect(mockSetCountryCode).toHaveBeenCalledWith('+1')
    })
  })
})

describe('when defaultCountry is truthy', () => {
  it('does not render an AutoComplete', () => {
    const { queryByTestId, toJSON } = render(
      <PhoneNumberInput
        defaultCountry={'Canada'}
        setE164Number={jest.fn()}
        setIsValidNumber={jest.fn()}
        setCountryCode={jest.fn()}
      />
    )
    expect(toJSON()).toMatchSnapshot()
    const autocomplete = queryByTestId('CountryNameField')
    expect(autocomplete).toBeFalsy()
  })

  describe('Native phone picker (Android)', () => {
    it('can read phone', async () => {
      // mock
      Platform.OS = 'android'

      const wrapper = shallow<PhoneNumberInput>(
        <PhoneNumberInput
          setE164Number={jest.fn()}
          setCountryCode={jest.fn()}
          setIsValidNumber={jest.fn()}
        />
      )

      wrapper.instance().setState({})
      await wrapper.instance().triggerPhoneNumberRequest()

      // expect(wrapper.find(ValidatedTextInput).props().value).toEqual('030 111111')

      expect(
        wrapper.findWhere((node) => node.prop('testID') === 'PhoneNumberField').props().value
      ).toBe('030 111111')
      expect(wrapper.instance().state.countryCallingCode).toEqual('+49')

      expect(
        wrapper.findWhere((node) => node.prop('testID') === 'contryCodeText').props().children
      ).toBe('+49')
      expect(
        wrapper.findWhere((node) => node.prop('testID') === 'CountryNameField').props().defaultValue
      ).toBe('Germany')
    })
  })
})
