import { Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base'
import { Interface, JsonFragment, ParamType, TransactionDescription } from '@ethersproject/abi'
import fetch from 'cross-fetch'
import { BigNumberish } from 'ethers'

export enum ParserErrorTypes {
  FetchAbiError = 'FetchAbiError',
}

export class FetchAbiError extends RootError<ParserErrorTypes.FetchAbiError> {
  constructor(error: Error) {
    super(ParserErrorTypes.FetchAbiError)
    this.message = error.message
  }
}

export type ParserErrors = FetchAbiError

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

  async parseAsResult(tx: Transaction): Promise<Result<TransactionDescription, ParserErrors>> {
    const abi = await this.fetchAbiForAddress(tx.to)
    if (!abi.ok) {
      return abi
    }
    const abiInterface = new Interface(abi.result)
    const data = abiInterface.parseTransaction(tx)
    return Ok(data)
  }
  parse = makeAsyncThrowable(this.parseAsResult.bind(this))

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

  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchAbiError>> {
    const request = await fetch(
      `https://repo.sourcify.dev/contracts/full_match/${this.chainId}/${address}/metadata.json`
    )
    if (!request.ok) {
      return Err(new FetchAbiError(new Error('Could not fetch ABI')))
    }

    const data = await request.json()
    const abi = data.output.abi
    return Ok(abi)
  }
}
