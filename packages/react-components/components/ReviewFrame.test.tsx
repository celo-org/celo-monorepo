import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import * as React from 'react'
import { Text } from 'react-native'
import { render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const Header = () => <Text>Header</Text>
const Footer = () => <Text>Footer</Text>

describe('ReviewFrame', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<ReviewFrame navigateBack={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })
  describe('when Header', () => {
    it('renders with Header', () => {
      const { getByType } = render(
        <ReviewFrame HeaderComponent={Header} navigateBack={jest.fn()} />
      )
      expect(getByType(Header)).toBeTruthy()
    })
  })
  describe('when Footer', () => {
    it('renders with Footer', () => {
      const { getByType } = render(
        <ReviewFrame FooterComponent={Footer} navigateBack={jest.fn()} />
      )
      expect(getByType(Footer)).toBeTruthy()
    })
  })
  describe('when has confirmButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const { getByText } = render(<ReviewFrame confirmButton={{ text: 'Confirm', action }} />)
      expect(getByText('Confirm')).toBeTruthy()
    })
  })
  describe('when has modifyButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const { getByText } = render(<ReviewFrame modifyButton={{ text: 'Edit', action }} />)
      expect(getByText('Edit')).toBeTruthy()
    })
  })
})
