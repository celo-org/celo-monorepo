import { randomBytes } from 'crypto'

export interface BlsBlindingClient {
  blindMessage: (base64PhoneNumber: string) => Promise<string>
  unblindAndVerifyMessage: (blindedMessage: string) => Promise<string>
}

export class WasmBlsBlindingClient implements BlsBlindingClient {
  private thresholdBls: any
  private blindedValue: any
  private odisPubKey: Uint8Array
  private rawMessage: Buffer | undefined

  constructor(odisPubKey: string) {
    this.odisPubKey = Buffer.from(odisPubKey, 'base64')
    // Dynamically load the Wasm library
    if (!this.isReactNativeEnvironment()) {
      this.thresholdBls = require('blind-threshold-bls')
    } else {
      // When using react instead rely upon this library instead
      // https://github.com/celo-org/react-native-blind-threshold-bls#cc36392
      throw new Error('Cannot use WasmBlsBlindingClient in a React Native app')
    }
  }

  async blindMessage(base64PhoneNumber: string): Promise<string> {
    const userSeed = randomBytes(32)
    this.rawMessage = Buffer.from(base64PhoneNumber)
    this.blindedValue = await this.thresholdBls.blind(this.rawMessage, userSeed)
    const blindedMessage = this.blindedValue.message
    return Buffer.from(blindedMessage).toString('base64')
  }

  async unblindAndVerifyMessage(base64BlindSig: string): Promise<string> {
    const blindedSignature = Buffer.from(base64BlindSig, 'base64')
    const unblindMessage = await this.thresholdBls.unblind(
      blindedSignature,
      this.blindedValue.blindingFactor
    )
    // this throws on error
    await this.thresholdBls.verify(this.odisPubKey, this.rawMessage, unblindMessage)
    return unblindMessage
  }

  private isReactNativeEnvironment(): boolean {
    return navigator && navigator.product === 'ReactNative'
  }
}
