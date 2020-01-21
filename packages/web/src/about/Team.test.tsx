import { render, waitForElement } from '@testing-library/react'
import 'jest-fetch-mock'
import * as React from 'react'
import Team from 'src/about/Team'

jest.mock('src/brandkit/common/Fetch', () => {
  return function Fetch({ children }) {
    return children({
      data: [
        {
          name: 'johnny',
          purpose: 'reliability',
          company: 'Decentralized ltd',
          photo: 'x.jpg',
          url: '/things',
        },
      ],
      loading: false,
      error: null,
    })
  }
})

describe(Team, () => {
  it('displays an image for each contributor', async () => {
    const { getByText, getByAltText } = render(<Team randomSeed={1} />)

    await waitForElement(() => getByText('johnny'))

    expect(getByAltText('Photo of johnny').getAttribute('src')).toEqual('x.jpg')
  })

  it('displays company name', async () => {
    const { getByText } = render(<Team randomSeed={1} />)

    await waitForElement(() => getByText('johnny'))

    expect(getByText('Decentralized ltd')).toBeTruthy()
  })
})
