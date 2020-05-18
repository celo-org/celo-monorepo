import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton.v2'

const testID = 'button'

describe('TopBarTextButton', () => {
  it('renders with minimum props', () => {
    const onPress = jest.fn()
    const { queryByText } = render(
      <TopBarTextButton testID={testID} title={'label'} onPress={onPress} />
    )
    expect(queryByText('label')?.props.children).toEqual('label')
  })

  it('fires an event when pressed', () => {
    const onPress = jest.fn()
    const { queryByTestId } = render(
      <TopBarTextButton testID={testID} title={'label'} onPress={onPress} />
    )
    fireEvent.press(queryByTestId(testID)!)
    expect(onPress).toBeCalled()
  })
})

describe('TopBarIconButton', () => {
  it('renders with minimum props', () => {
    const onPress = jest.fn()
    const { queryByText } = render(
      <TopBarIconButton testID={testID} icon={<Text>icon</Text>} onPress={onPress} />
    )
    expect(queryByText('icon')?.props.children).toEqual('icon')
  })

  it('fires an event when pressed', () => {
    const onPress = jest.fn()
    const { queryByTestId } = render(
      <TopBarIconButton testID={testID} icon={<Text>icon</Text>} onPress={onPress} />
    )
    fireEvent.press(queryByTestId(testID)!)
    expect(onPress).toBeCalled()
  })
})
