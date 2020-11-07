import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { View } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'

describe(RequestMessagingCard, () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const { getByText, getByTestId, getByName } = render(
      <RequestMessagingCard
        title="Test"
        amount="$15"
        details="Gold is where you can choose to store Celo dollars you have"
        icon={<View testID="TestIcon" />}
        callToActions={[{ text: 'it goes boom', onPress }]}
      />
    )

    expect(getByText('Test')).toBeDefined()
    expect(getByText('$15')).toBeDefined()
    expect(getByText('Gold is where you can choose to store Celo dollars you have')).toBeDefined()
    expect(getByTestId('TestIcon')).toBeDefined()

    expect(getByText('it goes boom')).toBeDefined()
    fireEvent.press(getByName('TextButton'))
    expect(onPress).toHaveBeenCalled()
  })
})
