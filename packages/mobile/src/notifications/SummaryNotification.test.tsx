import * as React from 'react'
import { Text, View } from 'react-native'
import * as renderer from 'react-test-renderer'
import { placeholder } from 'src/images/Images'
import SummaryNotification from 'src/notifications/SummaryNotification'

const props = () => ({
  image: placeholder,
  icon: <View />,
  title: 'Test',
  items: ['a'],
  itemRenderer: (item: string, key: number) => {
    return <Text>{`test-${item}`}</Text>
  },
  onReview: jest.fn(),
})

describe(SummaryNotification, () => {
  it('renders correctly', () => {
    const tree = renderer.create(<SummaryNotification<string> {...props()} />)
    expect(tree).toMatchSnapshot()
  })
})
