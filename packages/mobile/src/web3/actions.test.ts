import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import { GAS_PRICE_STALE_AFTER } from 'src/geth/consts'
import { waitForGethConnectivity } from 'src/geth/saga'
import { setGasPrice } from 'src/web3/actions'
import {
  fetchGasPrice,
  gasPriceLastUpdatedSelector,
  gasPriceSelector,
  refreshGasPrice,
} from 'src/web3/gas'

const GAS_PRICE_PLACEHOLDER: BigNumber = new BigNumber(100000000000)

const now = Date.now()
Date.now = jest.fn(() => now)

it('sets the price correctly', () => {
  expectSaga(refreshGasPrice)
    .provide([
      [call(waitForGethConnectivity), null],
      [select(gasPriceSelector), null],
      [select(gasPriceLastUpdatedSelector), null],
      [call(fetchGasPrice), GAS_PRICE_PLACEHOLDER],
    ])
    .put(setGasPrice(GAS_PRICE_PLACEHOLDER.toNumber()))
    .run()
})

describe('refreshGasPrice', () => {
  it('refreshes the gas price correctly', async () => {
    const setGasPriceMocked = jest.fn(setGasPrice)
    const gasPriceLastUpdated = now - GAS_PRICE_STALE_AFTER

    expectSaga(refreshGasPrice)
      .provide([
        [call(waitForGethConnectivity), null],
        [select(gasPriceSelector), 0],
        [select(gasPriceLastUpdatedSelector), gasPriceLastUpdated],
        [call(fetchGasPrice), GAS_PRICE_PLACEHOLDER],
      ])
      .put(setGasPriceMocked(GAS_PRICE_PLACEHOLDER.toNumber()))
      .run()

    expect(setGasPriceMocked.mock.calls.length).toBe(1)
  })

  it("doesn't update the gas price if the gas price isn't stale yet", async () => {
    const setGasPriceMocked = jest.fn()
    const gasPriceLastUpdated = now

    expectSaga(refreshGasPrice)
      .provide([
        [call(waitForGethConnectivity), null],
        [select(gasPriceSelector), 0],
        [select(gasPriceLastUpdatedSelector), gasPriceLastUpdated],
        [setGasPrice, setGasPriceMocked],
      ])
      .put(call(waitForGethConnectivity))
      .run()

    expect(setGasPriceMocked.mock.calls.length).toBe(0)
  })

  it('should not raise an exception', async () => {
    Date.now = () => {
      throw new Error()
    }

    expectSaga(refreshGasPrice)
      .provide([
        [call(waitForGethConnectivity), null],
        [select(gasPriceSelector), 0],
        [select(gasPriceLastUpdatedSelector), null],
      ])
      .put(showError(ErrorMessages.GAS_PRICE_UPDATE_FAILED, ERROR_BANNER_DURATION))
      .run()
  })
})
