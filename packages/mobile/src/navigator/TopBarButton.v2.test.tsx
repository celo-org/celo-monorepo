import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import TopBarButton from 'src/navigator/TopBarButton.v2'

describe('TopBarButton', () => {
  it('displays children', () => {
    const { queryByText } = render(<TopBarButton>label</TopBarButton>)
    expect(queryByText('label')?.props.children).toEqual('label')
  })
})
