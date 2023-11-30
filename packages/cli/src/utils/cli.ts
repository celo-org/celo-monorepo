import { CeloTransactionObject, CeloTx, EventLog, parseDecodedParams } from '@celo/connect'
import { CLIError } from '@oclif/errors'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import Table from 'cli-table'
import { cli } from 'cli-ux'

// TODO: How can we deploy contracts with the Celo provider w/o a CeloTransactionObject?
export async function displayWeb3Tx(name: string, txObj: any, tx?: Omit<CeloTx, 'data'>) {
  cli.action.start(`Sending Transaction: ${name}`)
  const result = await txObj.send(tx)
  console.log(result)
  cli.action.stop()
}

export async function displaySendTx<A>(
  name: string,
  txObj: CeloTransactionObject<A>,
  tx?: Omit<CeloTx, 'data'>,
  displayEventName?: string | string[]
) {
  cli.action.start(`Sending Transaction: ${name}`)
  try {
    const txResult = await txObj.send(tx)
    const txHash = await txResult.getHash()

    console.log(chalk`SendTransaction: {red.bold ${name}}`)
    printValueMap({ txHash })

    const txReceipt = await txResult.waitReceipt()
    cli.action.stop()

    if (displayEventName && txReceipt.events) {
      Object.entries(txReceipt.events)
        .filter(
          ([eventName]) =>
            (typeof displayEventName === 'string' && eventName === displayEventName) ||
            displayEventName.includes(eventName)
        )
        .forEach(([eventName, log]) => {
          const { params } = parseDecodedParams((log as EventLog).returnValues)
          console.log(chalk.magenta.bold(`${eventName}:`))
          printValueMap(params, chalk.magenta)
        })
    }
  } catch (e: any) {
    cli.action.stop(`failed: ${e.message}`)
    throw e
  }
}

export function printValueMap(valueMap: Record<string, any>, color = chalk.yellowBright.bold) {
  console.log(
    Object.keys(valueMap)
      .map((key) => color(`${key}: `) + valueMap[key])
      .join('\n')
  )
}

export function printValueMap2(valueMap: Map<any, any>, color = chalk.yellowBright.bold) {
  valueMap.forEach((value, key) => console.log(color(`${key}: `) + value))
}

export function printValueMapRecursive(valueMap: Record<string, any>) {
  console.log(toStringValueMapRecursive(valueMap, ''))
}

function toStringValueMapRecursive(valueMap: Record<string, any>, prefix: string): string {
  const printValue = (v: any): string => {
    if (typeof v === 'object' && v != null) {
      if (BigNumber.isBigNumber(v)) {
        const extra = v.isGreaterThan(new BigNumber(10).pow(3)) ? `(~${v.toExponential(3)})` : ''
        return `${v.toFixed()} ${extra}`
      } else if (v instanceof Error) {
        return '\n' + chalk.red(v.message)
      }
      return '\n' + toStringValueMapRecursive(v, prefix + '  ')
    }
    return chalk`${v}`
  }
  return Object.keys(valueMap)
    .map((key) => prefix + chalk.yellowBright.bold(`${key}: `) + printValue(valueMap[key]))
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

export async function binaryPrompt(promptMessage: string, defaultToNo?: boolean) {
  const resp: string = await cli.prompt(
    promptMessage + ` [y/yes, n/no${defaultToNo ? ' (default)' : ''}]`,
    { required: !defaultToNo }
  )
  return ['y', 'yes'].includes(resp.toLowerCase())
}
