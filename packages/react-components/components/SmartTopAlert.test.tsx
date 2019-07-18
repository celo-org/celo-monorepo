import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('SmartTopAlert', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <SmartTopAlert
        dismissAfter={5}
        title={'Smart Top Alert'}
        text="dont get funny"
        onPress={jest.fn()}
        type={NotificationTypes.MESSAGE}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
