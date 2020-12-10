import * as React from 'react'
import {
  renderIgnoringUnstableFlushDiscreteUpdates,
  TestProvider,
} from 'src/_page-tests/test-utils'
import About from 'src/about/About'

describe(About, () => {
  it('includes element with #contributors id', async () => {
    renderIgnoringUnstableFlushDiscreteUpdates(
      <TestProvider>
        <About contributors={[]} />
      </TestProvider>
    )
    expect(document.getElementById('contributors')).toBeTruthy()
  })
  it('includes element with #backers id', async () => {
    renderIgnoringUnstableFlushDiscreteUpdates(
      <TestProvider>
        <About contributors={[]} />
      </TestProvider>
    )
    expect(document.getElementById('backers')).toBeTruthy()
  })
})
