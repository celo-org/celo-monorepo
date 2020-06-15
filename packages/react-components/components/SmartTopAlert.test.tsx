import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { render } from 'react-native-testing-library'

describe('SmartTopAlert', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', async () => {
    const { toJSON } = render(
      <SmartTopAlert
        isVisible={true}
        timestamp={Date.now()}
        dismissAfter={5}
        title={'Smart Top Alert'}
        text="dont get funny"
        onPress={jest.fn()}
        type={NotificationTypes.MESSAGE}
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
