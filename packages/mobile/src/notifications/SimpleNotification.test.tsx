import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { placeholder } from 'src/images/Images'
import SimpleNotification from 'src/notifications/SimpleNotification'

const props = () => ({
  text: 'Gold is where you can choose to store Celo dollars you have',
  image: placeholder,
  title: 'Test',
  ctaList: [{ text: 'it goes boom', onPress: jest.fn() }],
})

describe(SimpleNotification, () => {
  it('renders correctly', () => {
    const tree = renderer.create(<SimpleNotification {...props()} />)
    expect(tree).toMatchSnapshot()
  })
})
