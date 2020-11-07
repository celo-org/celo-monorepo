import { TransactionObject } from 'web3-eth'
import { failWith } from './cli'

export enum Op {
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  LTE = 'LTE',
  GT = 'GT',
  GTE = 'GTE',
}

export function requireOp<A>(value: A, op: Op, expected: A, ctx: string) {
  const OpFn: Record<Op, (a: A, b: A) => boolean> = {
    [Op.EQ]: (a, b) => a === b,
    [Op.NEQ]: (a, b) => a !== b,
    [Op.LT]: (a, b) => a < b,
    [Op.LTE]: (a, b) => a <= b,
    [Op.GT]: (a, b) => a > b,
    [Op.GTE]: (a, b) => a >= b,
  }
  if (!OpFn[op](value, expected)) {
    failWith(`require(${ctx}) => [${value}, ${expected}]`)
  }
}
export async function requireCall<A>(
  callPromise: TransactionObject<A>,
  op: Op,
  expected: A,
  ctx: string
) {
  const value = await callPromise.call()
  requireOp(value, op, expected, ctx)
}
