import Button from '@celo/react-components/components/Button'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text } from 'react-native'
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
      const frame = shallow(<ReviewFrame HeaderComponent={Header} navigateBack={jest.fn()} />)
      expect(frame.find(Header).exists()).toBe(true)
    })
  })
  describe('when Footer', () => {
    it('renders with Footer', () => {
      const frame = shallow(<ReviewFrame FooterComponent={Footer} navigateBack={jest.fn()} />)
      expect(frame.find(Footer).exists()).toBe(true)
    })
  })
  describe('when has confirmButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const frame = shallow(<ReviewFrame confirmButton={{ text: 'Confirm', action }} />)
      expect(frame.find({ text: 'Confirm' }).type()).toEqual(Button)
    })
  })
  describe('when has modifyButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const frame = shallow(<ReviewFrame modifyButton={{ text: 'Edit', action }} />)
      expect(frame.find({ text: 'Edit' }).type()).toEqual(Button)
    })
  })
})
