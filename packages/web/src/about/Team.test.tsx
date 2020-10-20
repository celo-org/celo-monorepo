import { render, waitFor } from '@testing-library/react'
import 'jest-fetch-mock'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
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
    const { getByText, getByAltText } = render(
      <TestProvider>
        <Team contributors={CONTRIBUTORS} />
      </TestProvider>
    )

    await waitFor(() => getByText('johnny'))

    expect(getByAltText('Photo of johnny').getAttribute('src')).toEqual('x.jpg')
  })

  it('displays company name', async () => {
    const { getByText } = render(
      <TestProvider>
        <Team contributors={CONTRIBUTORS} />
      </TestProvider>
    )

    await waitFor(() => getByText('johnny'))

    expect(getByText('Decentralized ltd')).toBeTruthy()
  })
})
