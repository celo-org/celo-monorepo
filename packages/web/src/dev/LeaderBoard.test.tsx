import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import LeaderBoard from 'src/dev/LeaderBoard'

const leaders = new Array(12)
  .fill({ points: 10, identity: 'annie', address: '0x1f3f' })
  .map((leader, index) => {
    return {
      points: leader.points + index,
      identity: leader.identity + index,
      address: leader.address + index,
    }
  })

describe('LeaderBoard', () => {
  it('it displays an expand button, and when pressed a "collapse" button shows', () => {
    const { getByText } = render(
      <TestProvider>
        <LeaderBoard isLoading={false} leaders={leaders} />
      </TestProvider>
    )

    fireEvent.click(getByText('Expand Leaderboard'))
    expect(getByText('Collapse Leaderboard')).toBeTruthy()
  })

  it('displays a link to terms', () => {
    const { getAllByText } = render(
      <TestProvider>
        <LeaderBoard isLoading={false} leaders={leaders} />
      </TestProvider>
    )
    getAllByText(/Terms/i).map((el) => expect(el.getAttribute('href')).toEqual('/stake-off/terms'))
  })
})
