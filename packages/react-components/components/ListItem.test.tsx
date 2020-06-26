import ListItem from '@celo/react-components/components/ListItem'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const testID = 'ListItemTestID'

describe('ListItem', () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const tree = renderer.create(<ListItem children={<Text>test</Text>} onPress={onPress} />)
    expect(tree).toMatchSnapshot()
  })

  it('call onPress', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <ListItem testID={testID} children={<Text>test</Text>} onPress={onPress} />
    )

    const el = getByTestId(testID)
    fireEvent.press(el)
    expect(onPress).toHaveBeenCalled()
  })
})
