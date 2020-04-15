import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import LeaderBoard from 'src/dev/LeaderBoard'

const leaders = new Array(12).fill({ points: 10, identity: 'annie', address: '0x1f3f' })

describe('LeaderBoard', () => {
  it('it displays an expand button, and when pressed a "collapse" button shows', () => {
    const { getByText } = render(<LeaderBoard isLoading={false} leaders={leaders} />)

    fireEvent.click(getByText(/expand/))
    expect(getByText(/collapse/)).toBeTruthy()
  })

  it('displays a link to terms', () => {
    const { getAllByText } = render(<LeaderBoard isLoading={false} leaders={leaders} />)
    getAllByText(/Terms/i).map((el) => expect(el.getAttribute('href')).toEqual('/stake-off/terms'))
  })
})
