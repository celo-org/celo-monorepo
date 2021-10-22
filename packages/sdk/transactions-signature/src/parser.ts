import { Address, Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base'
import { Interface, ParamType, TransactionDescription } from '@ethersproject/abi'
import { BigNumberish } from 'ethers'
import { AbiFetcher, FetchAbiError, getAbisFromFetchers } from './abiFetcher'
import { BytesAsString } from './types'

export enum ParserErrorTypes {
  NoAbiFetchers = 'NoAbiFetchers',
  AbiMismatch = 'AbiMismatch',
  Unknown = 'Unknown',
}
export class NoAbiFetchersError extends RootError<ParserErrorTypes.NoAbiFetchers> {
  constructor(error: Error) {
    super(ParserErrorTypes.NoAbiFetchers)
    this.message = error.message
  }
}

export class AbiMismatchError extends RootError<ParserErrorTypes.AbiMismatch> {
  constructor(error: Error) {
    super(ParserErrorTypes.AbiMismatch)
    this.message = error.message
  }
}

export class UnknownError extends RootError<ParserErrorTypes.Unknown> {
  constructor(error: Error) {
    super(ParserErrorTypes.Unknown)
    this.message = error.message
  }
}

export type ParserErrors = FetchAbiError | AbiMismatchError | UnknownError | NoAbiFetchersError

interface Transaction {
  from: Address
  to: Address
  data: BytesAsString
  value: BigNumberish
}

export class Parser {
  /**
   * Creates a new instance of the parser
   * @param abiFetchers Array of AbiFetchers, order matters as priority (i.e. proxy fetcher before plain fetcher)
   */
  constructor(public readonly abiFetchers: AbiFetcher[]) {}

  async parseAsResult(tx: Transaction): Promise<Result<TransactionDescription, ParserErrors>> {
    if (this.abiFetchers.length === 0) {
      return Err(new NoAbiFetchersError(new Error('No AbiFetchers specified')))
    }
    const abis = await getAbisFromFetchers(this.abiFetchers, tx.to)

    if (!abis.ok) {
      return abis
    }

    const abiInterface = new Interface(abis.result[0])
    try {
      const data = abiInterface.parseTransaction(tx)
      return Ok(data)
    } catch (error) {
      if (error instanceof Error) {
        return Err(new AbiMismatchError(error))
      }
      return Err(new UnknownError((error as any).toString()))
    }
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
}
