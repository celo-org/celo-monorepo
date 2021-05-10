import { BigNumber } from 'bignumber.js'
import { Connection } from '../connection'
import { CeloTx } from '../types'
import { GasPriceStrategy, NodeGasPriceStrategy } from './gas-price-strategy'

function isEmpty(value: string | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '0' ||
    value.toLowerCase() === '0x' ||
    value.toLowerCase() === '0x0'
  )
}

export class TxParamsNormalizer {
  private chainId: number | null = null
  private gatewayFeeRecipient: string | null = null
  public gasPriceStrategy: GasPriceStrategy = new NodeGasPriceStrategy()

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

    if (!txParams.gasPrice || isEmpty(txParams.gasPrice.toString())) {
      let baseGasPrice
      try {
        baseGasPrice = new BigNumber(await this.connection.gasPrice(txParams.feeCurrency))
      } catch {
        // TODO: remove once stables gasPrice are available on minimumClientVersion node rpc (1.1.0)
        baseGasPrice = new BigNumber(0)
      }
      txParams.gasPrice = (
        await this.gasPriceStrategy.caculateGasPrice(
          { ...txParams }, // Shallow copy to avoid changing parameters
          baseGasPrice
        )
      ).toString()
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
