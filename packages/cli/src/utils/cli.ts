import chalk from 'chalk'
import Table from 'cli-table'
import { cli } from 'cli-ux'
import { TransactionObject, Tx } from 'web3/eth/types'
import { sendTx } from './tx'

export async function displaySendTx<A>(name: string, txObj: TransactionObject<A>, tx?: Tx) {
  cli.action.start(`Sending Transaction: ${name}`)
  const txResult = await sendTx(txObj, tx)

  const txHash = await txResult.getHash()

  console.log(chalk`SendTrasaction: {red.bold ${name}}`)
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

export function printVTable(valueMap: Record<string, any>) {
  const table = new Table()
  Object.keys(valueMap).forEach((key) => {
    table.push({ [key]: valueMap[key] })
  })
  console.log(table.toString())
}

export function failWith(msg: string): never {
  console.error(msg)
  return process.exit(1)
}
