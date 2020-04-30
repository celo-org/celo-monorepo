import { render } from '@testing-library/react'
import * as React from 'react'
import About from 'src/about/About'

describe(About, () => {
  it('includes element with #contributors id', async () => {
    render(<About contributors={[]} />)
    expect(document.getElementById('contributors')).toBeTruthy()
  })
  it('includes element with #backers id', async () => {
    render(<About contributors={[]} />)
    expect(document.getElementById('backers')).toBeTruthy()
  })
})
