import { render, waitForElement } from '@testing-library/react'
import 'jest-fetch-mock'
import * as React from 'react'
import Team from 'src/about/Team'

const CONTRIBUTORS = [
  {
    name: 'johnny',
    purpose: 'reliability',
    company: 'Decentralized ltd',
    photo: 'x.jpg',
    preview: 'y.png',
    url: '/things',
  },
]

describe(Team, () => {
  it('displays an image for each contributor', async () => {
    const { getByText, getByAltText } = render(<Team contributors={CONTRIBUTORS} />)

    await waitForElement(() => getByText('johnny'))

    expect(getByAltText('Photo of johnny').getAttribute('src')).toEqual('x.jpg')
  })

  it('displays company name', async () => {
    const { getByText } = render(<Team contributors={CONTRIBUTORS} />)

    await waitForElement(() => getByText('johnny'))

    expect(getByText('Decentralized ltd')).toBeTruthy()
  })
})
