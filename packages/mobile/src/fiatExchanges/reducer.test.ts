import { Actions } from 'src/fiatExchanges/actions'
import { initialState, reducer } from 'src/fiatExchanges/reducer'

describe('fiat exchange reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })
  const mockProvider1 = {
    name: 'Provider 1 name',
    icon: 'https://provider1.iconUrl',
  }
  const mockProvider2 = {
    name: 'Provider 2 name',
    icon: 'https://provider2.iconUrl',
  }

  it('SELECT_PROVIDER should override the provider', () => {
    let updatedState = reducer(undefined, {
      type: Actions.SELECT_PROVIDER,
      name: mockProvider1.name,
      icon: mockProvider1.icon,
    })
    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: mockProvider1,
    })

    updatedState = reducer(updatedState, {
      type: Actions.SELECT_PROVIDER,
      name: mockProvider2.name,
      icon: mockProvider2.icon,
    })
    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: mockProvider2,
    })
  })

  it('ASSIGN_PROVIDER_TO_TX_HASH assigns and clears last provider correctly', () => {
    const currencyCode = 'cUSD'
    const txHash1 = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'
    const txHash2 = '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852'

    let updatedState = reducer(undefined, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash1,
      currencyCode,
    })

    expect(updatedState).toEqual({
      ...initialState,
      txHashToProvider: {
        [txHash1]: {
          name: 'fiatExchangeFlow:cUsdDeposit',
          icon: expect.any(String),
        },
      },
    })

    updatedState = reducer(updatedState, {
      type: Actions.SELECT_PROVIDER,
      name: mockProvider1.name,
      icon: mockProvider1.icon,
    })
    updatedState = reducer(updatedState, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash2,
      currencyCode,
    })

    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: null,
      txHashToProvider: {
        [txHash1]: {
          name: 'fiatExchangeFlow:cUsdDeposit',
          icon: expect.any(String),
        },
        [txHash2]: {
          name: mockProvider1.name,
          icon: mockProvider1.icon,
        },
      },
    })
  })
})
