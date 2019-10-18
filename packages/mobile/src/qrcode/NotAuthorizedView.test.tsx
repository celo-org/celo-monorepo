import * as React from 'react'
import { render } from 'react-native-testing-library'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'

describe('NotAuthorizedView', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<NotAuthorizedView />)

    expect(toJSON()).toMatchSnapshot()
  })
})
