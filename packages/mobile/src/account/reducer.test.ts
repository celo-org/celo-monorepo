import { Actions } from 'src/account/actions'
import { initialState, reducer } from 'src/account/reducer'

describe('account reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('should update the daily limit if greater than 500', () => {
    expect(
      reducer(initialState, {
        type: Actions.UPDATE_DAILY_LIMIT,
        newLimit: 600,
      })
    ).toEqual({
      ...initialState,
      dailyLimitCusd: 600,
    })
  })

  it('should set the daily limit to default if lower than 500', () => {
    expect(
      reducer(initialState, {
        type: Actions.UPDATE_DAILY_LIMIT,
        newLimit: 300,
      })
    ).toEqual({
      ...initialState,
      dailyLimitCusd: 500,
    })
  })
})
