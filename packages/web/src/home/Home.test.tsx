import { render, waitForDomChange, waitForElement } from '@testing-library/react'
import * as React from 'react'
import Home from 'src/home/Home'

describe('when isRestricted is true', () => {
  it('never shows the coinlist logo or button', async () => {
    const { queryByText, queryByAltText } = render(<Home isRestricted={true} />)

    await waitForDomChange()

    expect(queryByText('coinlist.btn')).toBeFalsy()

    expect(queryByAltText('coinlist logo')).toBeFalsy()
  })
})

describe('when isRestricted is false', () => {
  it('shows the coinlist logo and button', async () => {
    const { queryByText, queryByAltText } = render(<Home isRestricted={false} />)

    await waitForElement(() => queryByText('coinlist.btn'))

    expect(queryByText('coinlist.btn').getAttribute('href')).toEqual(
      'https://coinlist.co/celo?utm_source=celo%20website&utm_medium=website%20widget&utm_campaign=celowebsite_20200318'
    )

    expect(queryByAltText('coinlist logo')).toBeTruthy()
  })
})

describe('static getInitialProps', () => {
  it('returns isRestricted as true by default', async () => {
    // @ts-ignore -- getInitialProps not set as static method
    expect(await Home.getInitialProps({})).toEqual({ isRestricted: true })
  })
})
