import BigNumber from 'bignumber.js'
import { Connection } from '../connection'
import { CeloTx } from '../types'

function isEmpty(value: string | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '0' ||
    value.toLowerCase() === '0x' ||
    value.toLowerCase() === '0x0'
  )
}
function isPresent(value: string | undefined) {
  return !isEmpty(value)
}

export class TxParamsNormalizer {
  private chainId: number | null = null
  private gatewayFeeRecipient: string | null = null

  constructor(readonly connection: Connection) {}

  public async populate(celoTxParams: CeloTx): Promise<CeloTx> {
    const txParams = { ...celoTxParams }

    const [chainId, nonce, gas, maxFeePerGas] = await Promise.all(
      [
        async () => {
          if (txParams.chainId == null) {
            return await this.getChainId()
          }
          return txParams.chainId
        },
        async () => {
          if (txParams.nonce == null) {
            return await this.connection.nonce(txParams.from!.toString())
          }
          return txParams.nonce
        },
        async () => {
          if (!txParams.gas || isEmpty(txParams.gas.toString())) {
            return await this.connection.estimateGas(txParams)
          }
          return txParams.gas
        },
        async () => {
          // if gasPrice is not set and maxFeePerGas is not set, set maxFeePerGas
          if (
            isEmpty(txParams.gasPrice?.toString()) &&
            isEmpty(txParams.maxFeePerGas?.toString())
          ) {
            const suggestedPrice = await this.connection.gasPrice(txParams.feeCurrency)
            // add small buffer to suggested price like other libraries do
            const priceWithRoom = new BigNumber(suggestedPrice)
              .times(120)
              .dividedBy(100)
              .integerValue()
              .toString(16)
            return `0x${priceWithRoom}`
          }
          return txParams.maxFeePerGas
        },
      ].map(async (fn) => fn())
    )
    txParams.chainId = chainId as number
    txParams.nonce = nonce as number
    txParams.gas = gas as string
    txParams.maxFeePerGas = maxFeePerGas

    // need to wait until after gas price has been handled
    // if maxFeePerGas is set make sure maxPriorityFeePerGas is also set
    if (
      isPresent(txParams.maxFeePerGas?.toString()) &&
      isEmpty(txParams.maxPriorityFeePerGas?.toString())
    ) {
      const clientMaxPriorityFeePerGas = await this.connection.rpcCaller.call(
        'eth_maxPriorityFeePerGas',
        []
      )
      txParams.maxPriorityFeePerGas = clientMaxPriorityFeePerGas.result
    }

    // remove gasPrice if maxFeePerGas is set
    if (isPresent(txParams.gasPrice?.toString()) && isPresent(txParams.maxFeePerGas?.toString())) {
      txParams.gasPrice = undefined
      delete txParams.gasPrice
    }

    return txParams
  }

  private async getChainId(): Promise<number> {
    if (this.chainId === null) {
      this.chainId = await this.connection.chainId()
    }
    return this.chainId
  }

  // Right now, Forno does not expose a node's coinbase so we can't
  // set the gatewayFeeRecipient. Once that is fixed, we can reenable
  // this.
  // @ts-ignore - see comment above
  private async getCoinbase(): Promise<string> {
    if (this.gatewayFeeRecipient === null) {
      this.gatewayFeeRecipient = await this.connection.coinbase()
    }
    if (this.gatewayFeeRecipient == null) {
      throw new Error(
        'missing-tx-params-populator@getCoinbase: Coinbase is null, we are not connected to a full ' +
          'node, cannot sign transactions locally'
      )
    }
    return this.gatewayFeeRecipient
  }
}
