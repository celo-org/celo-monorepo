import { render } from '@testing-library/react'
import * as React from 'react'
import About from 'src/about/About'

describe(About, () => {
  it('includes element with #contributors id', async () => {
    render(<About randomSeed={10} />)
    expect(document.getElementById('contributors')).toBeTruthy()
  })
})
