import { BigNumber } from 'bignumber.js'
import { CeloTx } from '../types'

export interface GasPriceStrategy {
  caculateGasPrice: (tx: CeloTx, nodeGasPriceSuggestion: BigNumber) => Promise<BigNumber>
}

export class NodeGasPriceStrategy implements GasPriceStrategy {
  async caculateGasPrice(_tx: CeloTx, nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    return nodeGasPriceSuggestion
  }
}

export class FixedGasPriceStrategy implements GasPriceStrategy {
  constructor(public gasPriceConstant: BigNumber.Value) {}

  async caculateGasPrice(_tx: CeloTx, _nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    return new BigNumber(this.gasPriceConstant)
  }
}

// This strategy should be remove once stables gasPrice are available on minimumClientVersion
// node rpc (1.1.0)
export class NodeOrStoredValueGasPriceStrategy implements GasPriceStrategy {
  constructor(private gasPriceMap: Map<string, string>) {}
  async caculateGasPrice(tx: CeloTx, nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    if (nodeGasPriceSuggestion.gt(0)) {
      return nodeGasPriceSuggestion
    }
    if (tx.feeCurrency && this.gasPriceMap.has(tx.feeCurrency)) {
      return new BigNumber(this.gasPriceMap.get(tx.feeCurrency)!)
    }
    throw new Error('Currency price not set in the connection layer')
  }
}
