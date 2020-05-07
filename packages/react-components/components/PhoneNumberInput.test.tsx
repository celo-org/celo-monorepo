import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import { requestPhoneNumber } from '@celo/react-native-sms-retriever'
import * as React from 'react'
import { Platform } from 'react-native'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'

const testNumber = '123'

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

      const { getByTestId, getByText } = render(
        <PhoneNumberInput
          setE164Number={jest.fn()}
          setCountryCode={jest.fn()}
          setIsValidNumber={jest.fn()}
        />
      )

      fireEvent(getByTestId('CountryNameFieldTextInput'), 'focus')
      await flushMicrotasksQueue()

      expect(getByTestId('PhoneNumberField').props.value).toBe('030 111111')
      expect(getByText('+49')).toBeTruthy()
      expect(getByTestId('CountryNameField').props.defaultValue).toBe('Germany')
    })
  })

  it("Don't trigger Native phone picker if there's data in the form", async () => {
    // mock
    Platform.OS = 'android'

    const { getByTestId } = render(
      <PhoneNumberInput
        setE164Number={jest.fn()}
        setCountryCode={jest.fn()}
        setIsValidNumber={jest.fn()}
      />
    )

    fireEvent.changeText(getByTestId('PhoneNumberField'), testNumber)

    expect(getByTestId('PhoneNumberField').props.value).toBe(testNumber)
    expect(getByTestId('countryCodeText').instance.text).toBeUndefined()
    expect(getByTestId('CountryNameField').props.defaultValue).toBe('')
  })

  it('can read Canada phone', async () => {
    // mock
    Platform.OS = 'android'
    const { getByTestId, getByText } = render(
      <PhoneNumberInput
        setE164Number={jest.fn()}
        setCountryCode={jest.fn()}
        setIsValidNumber={jest.fn()}
      />
    )

    requestPhoneNumber.mockReturnValue('+1 416-868-0000')

    fireEvent(getByTestId('CountryNameFieldTextInput'), 'focus')
    await flushMicrotasksQueue()

    expect(getByTestId('PhoneNumberField').props.value).toBe('(416) 868-0000')
    expect(getByText('+1')).toBeTruthy()
    expect(getByTestId('CountryNameField').props.defaultValue).toBe('Canada')
  })

  it('can read US phone', async () => {
    // mock
    Platform.OS = 'android'
    const { getByTestId, getByText } = render(
      <PhoneNumberInput
        setE164Number={jest.fn()}
        setCountryCode={jest.fn()}
        setIsValidNumber={jest.fn()}
      />
    )

    requestPhoneNumber.mockReturnValue('+1 415-426-5200')

    fireEvent(getByTestId('CountryNameFieldTextInput'), 'focus')
    await flushMicrotasksQueue()

    expect(getByTestId('PhoneNumberField').props.value).toBe('(415) 426-5200')
    expect(getByText('+1')).toBeTruthy()
    expect(getByTestId('CountryNameField').props.defaultValue).toBe('USA')
  })
})
