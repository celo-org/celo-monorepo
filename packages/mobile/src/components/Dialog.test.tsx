import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import Dialog from 'src/components/Dialog'

it('renders correctly', () => {
  const onPress = jest.fn()
  const tree = renderer.create(
    <Dialog isVisible={true} title="Dialog" actionPress={onPress} actionText="Ppess Me">
      "HELLO"
    </Dialog>
  )
  expect(tree).toMatchSnapshot()
})
