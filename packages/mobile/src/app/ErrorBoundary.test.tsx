import * as React from 'react'
import { render } from 'react-native-testing-library'
import ErrorBoundary from 'src/app/ErrorBoundary'

const ErrorComponent = () => {
  throw new Error('Snap!')
}

describe(ErrorBoundary, () => {
  it('catches the errors', () => {
    const wrapper = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(wrapper.getAllByText('oops')).toHaveLength(1)
  })
})
