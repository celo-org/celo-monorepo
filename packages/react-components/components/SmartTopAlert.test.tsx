import SmartTopAlert from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { render } from 'react-native-testing-library'

describe('SmartTopAlert', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', async () => {
    const { toJSON } = render(
      <SmartTopAlert
        alert={{
          dismissAfter: 5,
          title: 'Smart Top Alert',
          message: 'dont get funny',
          onPress: jest.fn(),
          type: 'message',
        }}
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
