import { CURRENCY_ENUM } from '@celo/utils'
import { ContractUtils } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { setGasPrice } from 'src/web3/actions'
import { web3 } from 'src/web3/contracts'

const TAG = 'web3/gas'
const GAS_PRICE_STALE_AFTER = 150000 // 15 seconds

export const gasPriceSelector = (state: RootState) => state.web3.gasPrice
export const gasPriceLastUpdatedSelector = (state: RootState) => state.web3.gasPriceLastUpdated

export function* refreshGasPrice() {
  yield call(waitWeb3LastBlock)

  let gasPrice = yield select(gasPriceSelector)
  const gasPriceLastUpdated = yield select(gasPriceLastUpdatedSelector)

  try {
    if (Date.now() - gasPriceLastUpdated >= GAS_PRICE_STALE_AFTER || gasPrice === undefined) {
      gasPrice = yield call(fetchGasPrice)
      yield put(setGasPrice(gasPrice.toNumber()))
    }
  } catch (error) {
    Logger.error(`${TAG}}/refreshGasPrice`, 'Could not fetch and update gas price.', error)
    yield put(showError(ErrorMessages.GAS_PRICE_UPDATE_FAILED))
  }
}

export const fetchGasPrice = async (currency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR) => {
  const gasPrice = new BigNumber(await ContractUtils.getGasPrice(web3, currency))
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Gas price fetched in ${currency} with value: ${gasPrice.toString()}`
  )
  return gasPrice
}
