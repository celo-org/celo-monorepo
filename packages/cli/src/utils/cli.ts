import { CeloTransactionObject, CeloTx, parseDecodedParams } from '@celo/connect'
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
  tx?: Omit<CeloTx, 'data'>
) {
  cli.action.start(`Sending Transaction: ${name}`)
  try {
    const txResult = await txObj.send(tx)

    const txHash = await txResult.getHash()

    console.log(chalk`SendTransaction: {red.bold ${name}}`)
    printValueMap({ txHash })

    const txReceipt = await txResult.waitReceipt()
    cli.action.stop()

    if (txReceipt.events) {
      let events: { [key: string]: any } = {}
      Object.values(txReceipt.events).forEach(
        (log) => (events[log.event] = parseDecodedParams(log.returnValues).params)
      )
      printValueMapRecursive(events, chalk.magenta)
    }
  } catch (e) {
    cli.action.stop(`failed: ${e.message}`)
    throw e
  }
}

export const printValueMap = (valueMap: Record<string, any>, color = chalk.yellowBright.bold) =>
  printValueMapRecursive(valueMap, color)

export const printValueMapRecursive = (
  valueMap: Record<string, any>,
  color = chalk.yellowBright.bold
) => console.log(toStringValueMapRecursive(valueMap, '', color))

function toStringValueMapRecursive(
  valueMap: Record<string, any>,
  prefix: string,
  color = chalk.yellowBright.bold
): string {
  const printValue = (v: any): string => {
    if (typeof v === 'object' && v != null) {
      if (BigNumber.isBigNumber(v)) {
        const extra = v.isGreaterThan(new BigNumber(10).pow(3)) ? `(~${v.toExponential(3)})` : ''
        return `${v.toFixed()} ${extra}`
      }
      return '\n' + toStringValueMapRecursive(v, prefix + '  ', color)
    }
    return chalk`${v}`
  }
  return Object.keys(valueMap)
    .map((key) => prefix + color(`${key}: `) + printValue(valueMap[key]))
    .join('\n')
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
