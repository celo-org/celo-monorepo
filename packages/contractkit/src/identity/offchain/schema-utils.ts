import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import OffchainDataWrapper from '../offchain-data-wrapper'

export class SingleSchema<T> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<T>,
    readonly dataPath: string
  ) {}

  async read(account: string) {
    const data = await this.wrapper.readDataFrom(account, this.dataPath)
    const asJson = JSON.parse(data)
    const parseResult = this.type.decode(asJson)
    if (isLeft(parseResult)) {
      return undefined
    }

    return parseResult.right
  }

  async write(data: T) {
    if (!this.type.is(data)) {
      return
    }
    const serializedData = JSON.stringify(data)
    await this.wrapper.writeDataTo(serializedData, this.dataPath)
    return
  }
}
