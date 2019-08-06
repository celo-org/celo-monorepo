import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { AlertBanner } from 'src/alert/AlertBanner'

/*
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

*/

describe('AlertBanner', () => {
  const baseProps = {
    hideAlert: jest.fn(),
  }

  describe('when message passed in', () => {
    it('renders message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            title: 'Declaration',
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when error message passed in', () => {
    it('renders error message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'error',
            message: 'This is an error',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
