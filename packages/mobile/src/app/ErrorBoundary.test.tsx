import { shallow } from 'enzyme'
import * as React from 'react'
import { View } from 'react-native'
import ErrorBoundary from 'src/app/ErrorBoundary'

describe(ErrorBoundary, () => {
  it('catchs the errors', () => {
    const wrapper = shallow(
      <ErrorBoundary>
        <View />
      </ErrorBoundary>
    ).dive()
    const error = new Error('Snap!')
    // @ts-ignore
    wrapper.find(View).simulateError(error)
    expect(wrapper.state()).toEqual({ childError: error })
  })
})
