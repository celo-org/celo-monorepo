import { Interface, JsonFragment, ParamType, TransactionDescription } from '@ethersproject/abi'
import fetch from 'cross-fetch'
import { BigNumberish } from 'ethers'
type Address = string
type BytesAsString = string

interface Transaction {
  from: Address
  to: Address
  data: BytesAsString
  value: BigNumberish
}

export class Parser {
  constructor(public readonly chainId: number) {}

  async parse(tx: Transaction) {
    const abi = await this.fetchAbiForAddress(tx.to)
    const abiInterface = new Interface(abi)
    const data = abiInterface.parseTransaction(tx)
    return data
  }

  private formatParam(paramValue: any, paramType: ParamType) {
    if (paramType.arrayChildren) {
      return `[${paramValue
        .map((el: any) => this.formatParam(el, paramType.arrayChildren))
        .join(', ')}]`
    }
    if (paramType.type === 'uint256') {
      return paramValue.toString()
    }

    if (paramType.type === 'address') {
      return `"${paramValue}"`
    }

    return paramValue
  }

  formatTxDescriptionToHuman(description: TransactionDescription) {
    const functionName = description.name
    const inputs = description.args.map((arg, index) => {
      const fragment = description.functionFragment.inputs[index]
      return `${fragment.name}: ${this.formatParam(arg, fragment)}`
    })
    return `${functionName}(${inputs.join(', ')})`
  }

  async fetchAbiForAddress(address: Address): Promise<JsonFragment[]> {
    const request = await fetch(
      `https://repo.sourcify.dev/contracts/full_match/${this.chainId}/${address}/metadata.json`
    )
    if (!request.ok) {
      return []
    }

    const data = await request.json()
    const abi = data.output.abi
    return abi
  }
}
