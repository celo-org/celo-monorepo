import { Actions } from 'src/stableToken/actions'
import { initialState, reducer } from 'src/stableToken/reducer'

describe('stableToken reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('should set the current balance', () => {
    expect(
      reducer(undefined, {
        type: Actions.SET_BALANCE,
        balance: '10',
      })
    ).toEqual({
      ...initialState,
      balance: '10',
      lastFetch: expect.any(Number),
    })
  })

  it('should set education completed', () => {
    expect(
      reducer(undefined, {
        type: Actions.SET_EDUCATION_COMPLETED,
        educationCompleted: true,
      })
    ).toEqual({
      ...initialState,
      educationCompleted: true,
    })
  })
})
