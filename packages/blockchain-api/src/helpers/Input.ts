import coder from 'web3-eth-abi'

const TRANSFER_WITH_COMMENT = '0xe1d6aceb'

export class Input {
  static fromString(inputString: string): Input {
    if (!inputString || inputString.length < 10) {
      return new Input()
    }

    return new Input(inputString.slice(0, 10), '0x' + inputString.slice(10))
  }

  functionSelector: string
  data: string

  private constructor(functionSelector: string = '', data: string = '') {
    this.functionSelector = functionSelector
    this.data = data
  }

  decode(abi: string[]): string[] | undefined {
    if (!this.data) {
      return
    }

    try {
      return coder.decodeParameters(abi, this.data)
    } catch (e) {
      console.log(`Error decoding input: ${e.message}`)
      return
    }
  }

  isTransferWithComment(): boolean {
    return this.functionSelector === TRANSFER_WITH_COMMENT
  }
}
