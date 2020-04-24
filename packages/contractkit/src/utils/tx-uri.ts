import { trimLeading0x } from '@celo/utils/lib/address'
import { range } from 'lodash'
import qrcode from 'qrcode'
import querystring from 'querystring'
import { Tx } from 'web3-core'
import abi from 'web3-eth-abi'

// URI scheme mostly borrowed from https://github.com/ethereum/EIPs/blob/master/EIPS/eip-681.md

// see https://solidity.readthedocs.io/en/v0.5.3/abi-spec.html#function-selector-and-argument-encoding
const ABI_TYPE_REGEX = ',?(u?int(8|16|32|64|128|256)|address|bool|bytes(4|32)?|string)(\\[\\])?'
const FUNCTION_REGEX = `(?<function>\\w+\\((?<inputTypes>(${ABI_TYPE_REGEX})*)\\))`

const ADDRESS_REGEX_STR = '(?<address>0x[a-fA-F0-9]{40})'
const CHAIN_ID_REGEX = '(?<chainId>\\d+)'

const PARAM_REGEX = '&?(\\w+)=(\\w+)'
const PARAMS_REGEX = `(?<params>(${PARAM_REGEX})+)`

const URI_REGEX_STR = `^celo:${ADDRESS_REGEX_STR}(@${CHAIN_ID_REGEX})?(/${FUNCTION_REGEX})?(\\?${PARAMS_REGEX})?$`

const uriRegexp = new RegExp(URI_REGEX_STR)

export function parseUri(uri: string): Tx {
  const matchObj = uriRegexp.exec(uri)
  if (matchObj == null) {
    throw new Error(`URI ${uri}\n did not match\n ${URI_REGEX_STR}`)
  }
  const namedGroups = (matchObj as any).groups

  let tx: Tx = {
    to: namedGroups.address,
  }

  if (namedGroups.chainId !== undefined) {
    tx.chainId = namedGroups.chainId
  }

  if (namedGroups.params !== undefined) {
    const queryParams = querystring.parse(namedGroups.params)

    if (namedGroups.function !== undefined) {
      const functionSig = abi.encodeFunctionSignature(namedGroups.function)
      tx.data = functionSig

      if (namedGroups.inputTypes !== undefined) {
        const abiTypes = namedGroups.inputTypes.split(',')
        // TODO(yorke): fix delete hacks
        let args: string[] = []
        range(0, abiTypes.length).forEach((idx) => {
          args = args.concat(queryParams[idx])
          delete queryParams[idx]
        })
        const callSig = abi.encodeParameters(abiTypes, args)

        tx.data += trimLeading0x(callSig)
      }
    }

    tx = { ...tx, ...queryParams }
  }

  return tx
}

export function buildUri(tx: Tx, functionName?: string, abiTypes: string[] = []): string {
  if (!tx.to) {
    throw new Error("'to' address must be defined for celo URIs")
  }
  let uri = `celo:${tx.to!}`

  if (tx.chainId) {
    uri += `@${tx.chainId}`
  }

  let paramsAppended = false
  if (tx.data !== undefined) {
    if (!functionName) {
      throw new Error("Cannot decode tx 'data' without 'functionName'")
    }

    const functionSelector = `${functionName}(${abiTypes.join(',')})`
    const functionSig = trimLeading0x(abi.encodeFunctionSignature(functionSelector))
    const txData = trimLeading0x(tx.data)
    const funcEncoded = txData.slice(0, 8)

    if (functionSig !== funcEncoded) {
      throw new Error("'functionName' and 'abiTypes' do not match first 4 bytes of 'tx.data'")
    }

    uri += `/${functionSelector}`

    if (txData.length > 8) {
      const argsEncoded = txData.slice(8)
      const decoded = abi.decodeParameters(abiTypes, argsEncoded)

      delete decoded.__length__

      uri += `?${querystring.stringify({ ...decoded }).toLowerCase()}`
      paramsAppended = true
    }
  }

  if (!paramsAppended) {
    uri += '?'
  }

  const { data, to, chainId, nonce, hardfork, common, chain, ...txQueryParams } = tx

  uri += querystring.stringify({ ...txQueryParams })

  return uri
}

export function QrFromUri(uri: string, type: 'svg' | 'terminal' | 'utf8') {
  if (!uriRegexp.test(uri)) {
    throw new Error(`Invalid uri ${uri}`)
  }

  return qrcode.toString(uri, { type })
}
