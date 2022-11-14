import { randomBytes } from 'crypto'

export interface BlsBlindingClient {
  blindMessage: (base64PhoneNumber: string, seed?: Buffer) => Promise<string>
  unblindAndVerifyMessage: (blindedMessage: string) => Promise<string>
}

// The following interfaces should match https://github.com/celo-org/blind-threshold-bls-wasm/blob/master/src/blind_threshold_bls.d.ts

interface ThresholdBlsLib {
  blind: (message: Uint8Array, seed: Uint8Array) => BlindedMessage
  unblind: (blindedSignature: Uint8Array, blindingFactor: Uint8Array) => Uint8Array
  verify: (publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array) => void // throws on failure
}

interface BlindedMessage {
  blindingFactor: Uint8Array
  message: Uint8Array
}

export class WasmBlsBlindingClient implements BlsBlindingClient {
  private thresholdBls: ThresholdBlsLib
  private odisPubKey: Uint8Array
  private blindedValue: BlindedMessage | undefined
  private rawMessage: Buffer | undefined

  constructor(odisPubKey: string) {
    this.odisPubKey = Buffer.from(odisPubKey, 'base64')
    // Dynamically load the Wasm library
    // Checkout out documentation for alternative runtime environments:
    // https://github.com/celo-org/identity/tree/ASv2/asv2#runtime-environments
    if (this.isReactNativeEnvironment()) {
      throw new Error('Cannot use WasmBlsBlindingClient in a React Native app')
    } else if (this.isBrowserEnvironment()) {
      throw new Error('Cannot use WasmBlsBlindingClient in a browser environment')
    } else {
      this.thresholdBls = require('blind-threshold-bls')
    }
  }

  async blindMessage(base64PhoneNumber: string, seed?: Buffer): Promise<string> {
    const userSeed = seed ?? randomBytes(32)
    if (!seed) {
      console.warn(
        'Warning: Use a private deterministic seed (e.g. DEK private key) to preserve user quota when requests are replayed.'
      )
    }
    this.rawMessage = Buffer.from(base64PhoneNumber, 'base64')
    this.blindedValue = await this.thresholdBls.blind(this.rawMessage, userSeed)
    const blindedMessage = this.blindedValue.message
    return Buffer.from(blindedMessage).toString('base64')
  }

  async unblindAndVerifyMessage(base64BlindSig: string): Promise<string> {
    if (!this.rawMessage || !this.blindedValue) {
      throw new Error('Must call blind before unblinding')
    }

    const blindedSignature = Buffer.from(base64BlindSig, 'base64')
    const unblindMessage = await this.thresholdBls.unblind(
      blindedSignature,
      this.blindedValue.blindingFactor
    )
    // this throws on error
    await this.thresholdBls.verify(this.odisPubKey, this.rawMessage, unblindMessage)
    return Buffer.from(unblindMessage).toString('base64')
  }

  private isReactNativeEnvironment(): boolean {
    return typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
  }

  // https://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
  // tslint:disable-next-line: function-constructor
  private isBrowserEnvironment = new Function('try {return this===window;}catch(e){ return false;}')
}
