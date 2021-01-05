import { CeloTxReceipt, PromiEvent } from '@celo/connect'
import { EventEmitter } from 'events'

interface PromiEventStub<T> extends PromiEvent<T> {
  emitter: EventEmitter
  resolveHash(hash: string): void
  resolveReceipt(receipt: CeloTxReceipt): void
  rejectHash(error: any): void
  rejectReceipt(receipt: CeloTxReceipt, error: any): void
}
export function promiEventSpy<T>(): PromiEventStub<T> {
  const ee = new EventEmitter()
  const pe: PromiEventStub<T> = {
    catch: () => {
      throw new Error('not implemented')
    },
    then: () => {
      throw new Error('not implemented')
    },
    finally: () => {
      throw new Error('not implemented')
    },
    on: ((event: string, listener: (...args: any[]) => void) => ee.on(event, listener)) as any,
    once: ((event: string, listener: (...args: any[]) => void) => ee.once(event, listener)) as any,
    [Symbol.toStringTag]: 'Not Implemented',
    emitter: ee,
    resolveHash: (hash: string) => {
      ee.emit('transactionHash', hash)
    },
    resolveReceipt: (receipt: CeloTxReceipt) => {
      ee.emit('receipt', receipt)
    },
    rejectHash: (error: any) => {
      ee.emit('error', error, false)
    },
    rejectReceipt: (receipt: CeloTxReceipt, error: any) => {
      ee.emit('error', error, receipt)
    },
  }
  return pe
}
