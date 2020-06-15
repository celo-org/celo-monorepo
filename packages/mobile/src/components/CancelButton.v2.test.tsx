import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import CancelButton from 'src/components/CancelButton.v2'

describe('CancelButton', () => {
  it('displays cancel', () => {
    const { queryByText } = render(<CancelButton />)
    expect(queryByText('cancel')).toBeTruthy()
  })
})
