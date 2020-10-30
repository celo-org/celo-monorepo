import SimpleMessagingCard from '@celo/react-components/components/SimpleMessagingCard'
import * as React from 'react'
import { View } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'

describe(SimpleMessagingCard, () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const { getByText, getByTestId, getByName } = render(
      <SimpleMessagingCard
        text="Test"
        icon={<View testID="TestIcon" />}
        callToActions={[{ text: 'it goes boom', onPress }]}
      />
    )

    expect(getByText('Test')).toBeDefined()
    expect(getByTestId('TestIcon')).toBeDefined()

    expect(getByText('it goes boom')).toBeDefined()
    fireEvent.press(getByName('TextButton'))
    expect(onPress).toHaveBeenCalled()
  })
})
