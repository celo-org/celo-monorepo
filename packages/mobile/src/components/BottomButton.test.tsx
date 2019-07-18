import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'
import BottomButton from 'src/components/BottomButton'

it('renders correctly', () => {
  const onPress = () => {
    return
  }
  const tree = renderer.create(<BottomButton buttonMessage="test" onPress={onPress} />)
  expect(tree).toMatchSnapshot()
})

it('should call onPress', () => {
  const onPress = jest.fn()
  const wrapper = render(<BottomButton buttonMessage="test" onPress={onPress} />)

  wrapper.getAllByType(TouchableOpacity).forEach((child) => {
    fireEvent.press(child)
  })

  expect(onPress.mock.calls.length).toBe(1)
})
