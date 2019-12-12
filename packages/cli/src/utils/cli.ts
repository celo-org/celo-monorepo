import { CeloTransactionObject } from '@celo/contractkit'
import { CLIError } from '@oclif/errors'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import Table from 'cli-table'
import { cli } from 'cli-ux'
import { Tx } from 'web3/eth/types'

export async function displaySendTx<A>(
  name: string,
  txObj: CeloTransactionObject<A>,
  tx?: Omit<Tx, 'data'>
) {
  cli.action.start(`Sending Transaction: ${name}`)
  const txResult = await txObj.send(tx)

  const txHash = await txResult.getHash()

  console.log(chalk`SendTransaction: {red.bold ${name}}`)
  printValueMap({ txHash })

  await txResult.waitReceipt()
  cli.action.stop()
}

export function printValueMap(valueMap: Record<string, any>) {
  console.log(
    Object.keys(valueMap)
      .map((key) => chalk`{red.bold ${key}:} ${valueMap[key]}`)
      .join('\n')
  )
}

export function printValueMapRecursive(valueMap: Record<string, any>) {
  console.log(toStringValueMapRecursive(valueMap, ''))
}

function toStringValueMapRecursive(valueMap: Record<string, any>, prefix: string): string {
  const printValue = (v: any): string => {
    if (typeof v === 'object' && v != null) {
      if (BigNumber.isBigNumber(v)) {
        const factor = new BigNumber(10).pow(18)
        const extra = v.isGreaterThan(factor) ? `(~${v.div(factor).decimalPlaces(2)} 10^18)` : ''
        return `${v.toFixed()} ${extra}`
      }
      return '\n' + toStringValueMapRecursive(v, prefix + '  ')
    }
    return chalk`${v}`
  }
  return Object.keys(valueMap)
    .map((key) => prefix + chalk`{red.bold ${key}:} ${printValue(valueMap[key])}`)
    .join('\n')
}

export function printVTable(valueMap: Record<string, any>) {
  const table = new Table()
  Object.keys(valueMap).forEach((key) => {
    table.push({ [key]: valueMap[key] })
  })
  console.log(table.toString())
}

export function failWith(msg: string): never {
  throw new CLIError(msg)
}

export async function binaryPrompt(promptMessage: string) {
  const resp = await cli.prompt(promptMessage + ' [y/yes, n/no]')
  return ['y', 'yes'].includes(resp)
}
