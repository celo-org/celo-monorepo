import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import { SendCallToAction } from 'src/send/SendCallToAction'

describe('SendCallToAction', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <SendCallToAction
        icon={<VerifyPhone height={49} />}
        header={'header'}
        body={'body'}
        cta={'cta'}
        onPressCta={jest.fn()}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
