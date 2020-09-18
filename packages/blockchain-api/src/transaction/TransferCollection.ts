import { BlockscoutCeloTransfer } from '../blockscout'

export type TransferFilter = (transfer: BlockscoutCeloTransfer) => boolean

export class TransferCollection {
  private transfers: BlockscoutCeloTransfer[] = []

  get length(): number {
    return this.transfers.length
  }

  constructor(transfers: BlockscoutCeloTransfer[]) {
    this.transfers = transfers
  }

  isEmpty(): boolean {
    return this.transfers.length === 0
  }

  pop(): BlockscoutCeloTransfer | undefined {
    return this.transfers.pop()
  }

  popWhich(predicate: TransferFilter): BlockscoutCeloTransfer | undefined {
    const index = this.transfers.findIndex(predicate)
    return index > -1 ? this.transfers.splice(index, 1)[0] : undefined
  }

  get(predicate: TransferFilter): BlockscoutCeloTransfer | undefined {
    const index = this.transfers.findIndex(predicate)
    return index > -1 ? this.transfers[index] : undefined
  }
}
