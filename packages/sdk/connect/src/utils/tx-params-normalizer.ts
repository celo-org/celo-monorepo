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

    if (txParams.chainId == null) {
      txParams.chainId = await this.getChainId()
    }

    if (txParams.nonce == null) {
      txParams.nonce = await this.connection.nonce(txParams.from!.toString())
    }

    if (!txParams.gas || isEmpty(txParams.gas.toString())) {
      txParams.gas = await this.connection.estimateGas(txParams)
    }

    // if gasPrice is not set and maxFeePerGas is not set, set maxFeePerGas
    if (isEmpty(txParams.gasPrice?.toString()) && isEmpty(txParams.maxFeePerGas?.toString())) {
      const suggestedPrice = await this.connection.gasPrice(txParams.feeCurrency)
      // add small buffer to suggested price like other libraries do
      // const priceWithRoom = new BigNumber(suggestedPrice).times(120).dividedBy(100).toString()
      txParams.maxFeePerGas = suggestedPrice
    }

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
