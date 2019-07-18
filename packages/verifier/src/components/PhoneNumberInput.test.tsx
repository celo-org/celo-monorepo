import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'

describe('PhoneNumberInput', () => {
  const baseProps = {
    defaultCountry: null,
    setE164Number: jest.fn(),
    setCountryCode: jest.fn(),
    setIsValidNumber: jest.fn(),
  }
  describe('when no defaultCountry', () => {
    it('renders AutoComplete', () => {
      const tree = renderer.create(<PhoneNumberInput {...baseProps} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when defaultCountry', () => {
    it('renders defaults', () => {
      const tree = renderer.create(<PhoneNumberInput {...baseProps} defaultCountry="argentina" />)
      expect(tree).toMatchSnapshot()
    })
  })
})
