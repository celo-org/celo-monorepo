import { randomBytes } from 'crypto'
// TODO(victor): This will only initially work in Node environments. If we want to have this work in
// ReactNative and browser environments, some work will need to be done in @celo/poprf or here.
import * as poprf from '@celo/poprf'

export class PoprfClient {
  /** Secret blinding factor used for blinding and response verification. */
  private readonly blindingFactor: Buffer

  /** Blinded message to be sent to the POPRF server for evaluation */
  public readonly blindedMessage: Buffer

  constructor(
    readonly publicKey: Buffer,
    readonly tag: Buffer,
    readonly message: Buffer,
    readonly seed?: Buffer
  ) {
    const blinded = poprf.blindMsg(message, seed ?? randomBytes(32))

    // Save the blinding factor to the class state so that unblind can use it.
    this.blindingFactor = Buffer.from(blinded.blindingFactor)
    this.blindedMessage = Buffer.from(blinded.message)
  }

  public unblindResponse(response: Buffer): Buffer {
    return Buffer.from(poprf.unblindResp(this.publicKey, this.blindingFactor, this.tag, response))
  }
}

export class PoprfCombiner {
  public static blindAggregate(responses: Array<Buffer>): Buffer {}
}

export class PoprfServer {
  constructor(readonly privateKey: Buffer) {}

  /** Evaluates the POPRF function over the tag and blinded message with the (complete) private key */
  public blindEval(tag: Buffer, blindedMessage: Buffer): Buffer {
    return Buffer.from(poprf.blindEval(this.privateKey, tag, blindedMessage))
  }

  /** Evaluates the POPRF function over the tag and blinded message with the private key share */
  public blindPartialEval(tag: Buffer, blindedMessage: Buffer): Buffer {
    return Buffer.from(poprf.blindPartialEval(this.privateKey, tag, blindedMessage))
  }
}
