import CircleButton from '@celo/react-components/components/CircleButton'
import { shallow } from 'enzyme'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('CircleButton', () => {
  it('renders correctly with minimum props', () => {
    const tree = renderer.create(<CircleButton onPress={jest.fn()} solid={true} />)
    expect(tree).toMatchSnapshot()
  })
  describe('when given optional props', () => {
    it('renders correctly', () => {
      const tree = renderer.create(
        <CircleButton
          onPress={jest.fn()}
          solid={false}
          style={{ flexDirection: 'column' }}
          size={50}
          borderWidth={3}
          disabled={false}
          activeColor="#333333"
          inactiveColor="#666666"
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when pressed', () => {
    it('calls the onPress prop', () => {
      const onPress = jest.fn()
      const circleButton = shallow(<CircleButton onPress={onPress} solid={true} />)
      circleButton.find({ onPress }).simulate('press')
      expect(onPress).toHaveBeenCalled()
    })
  })
  describe('when disabled', () => {
    it('sets disabled on the same Touchable onPress is set on', () => {
      const onPress = jest.fn()
      const circleButton = shallow(<CircleButton onPress={onPress} solid={true} disabled={true} />)
      expect(circleButton.find({ onPress }).prop('disabled')).toBe(true)
    })
  })
})
