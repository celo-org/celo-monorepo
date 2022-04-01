import { randomBytes } from 'crypto'
// TODO(victor): This will only initially work in Node environments. If we want to have this work in
// ReactNative and browser environments, some work will need to be done in @celo/poprf or here.
import * as poprf from '@celo/poprf'

export class PoprfClient {
  /** Secret blinding factor used for blinding and response verification. */
  protected readonly blindingFactor: Buffer

  /** Blinded message to be sent to the POPRF service for evaluation */
  public readonly blindedMessage: Buffer

  /**
   * Constructs POPRF client state, blinding the given message and saving the public key, blinding
   * factor, and tag for use in verification and unbinding of the response.
   *
   * Note that this client represents the client-side of a single protocol exchange.
   *
   * @param publicKey Public key for the POPRF service for use in verification.
   * @param tag A plaintext tag which will be sent to the service along with the message.
   * @param message A plaintext message which you want to blind and send to the POPRF service.
   * @param seed Seed for the blinding factor. Provided if deterministic blinding is needed.
   *   Note that, by design, if the same seed and message is used twice, the blinded message will be
   *   the same. This allows for linking between the two blinded messages and so only should be used
   *   if this is intended (e.g. to provide for retries of requests without consuming quota).
   */
  constructor(
    readonly publicKey: Uint8Array,
    readonly tag: Uint8Array,
    readonly message: Uint8Array,
    readonly seed?: Uint8Array
  ) {
    const blinded = poprf.blindMsg(message, seed ?? randomBytes(32))

    // Save the blinding factor to the class state so that unblind can use it.
    this.blindingFactor = Buffer.from(blinded.blindingFactor)
    this.blindedMessage = Buffer.from(blinded.blindedMessage)
  }

  /**
   * Given a blinded evaluation response, unblind and verify the evaluation, returning the result.
   *
   * @param response A blinded evaluation response.
   * @returns a buffer with the final POPRF output.
   *
   * @throws If the given response is invalid or cannot be verified against the public key, tag, and
   * blinding state present in this client.
   */
  public unblindResponse(response: Uint8Array): Buffer {
    return Buffer.from(poprf.unblindResp(this.publicKey, this.blindingFactor, this.tag, response))
  }
}

export class PoprfCombiner {
  readonly blindedResponses: Buffer[] = []

  constructor(readonly threshold: number) {
    if (threshold % 1 !== 0) {
      throw new Error('POPRF threshold must be an integer')
    }
  }

  /**
   * Adds the given blinded partial response(s) to the array of responses held on this object.
   */
  public addBlindedResponse(...responses: Uint8Array[]) {
    this.blindedResponses.push(...responses.map(Buffer.from))
  }

  /**
   * If there are enough responses added to this combiner instance, aggregates the current
   * collection of blind partial evaluations to a single blind threshold evaluation.
   *
   * @remarks This method does not verify any of the responses. Verification only occurs during
   * unblinding.
   *
   * @returns A buffer with a blind aggregated POPRF evaluation response, or undefined if there are
   * less than the threshold number of responses available.
   */
  public blindAggregate(): Buffer | undefined {
    if (this.blindedResponses.length < this.threshold) {
      return undefined
    }

    return Buffer.from(poprf.blindAggregate(this.threshold, Buffer.concat(this.blindedResponses)))
  }
}

// TODO(victor) Combine this class with the functionality from the combiner to create a POPRF client
// that can handle expunging bad partial evaluations from a set of responses.
export class ThresholdPoprfClient extends PoprfClient {
  /**
   * Constructs POPRF client state, blinding the given message and saving the public keys, blinding
   * factor, and tag for use in verification and unbinding of the response.
   *
   * Note that this client represents the client-side of a single protocol exchange.
   *
   * @param publicKey Public key for the POPRF service for use in verification.
   * @param polynomial Public key polynomial for the individual POPRF servers for use in verification.
   * @param tag A plaintext tag which will be sent to the service along with the message.
   * @param message A plaintext message which you want to blind and send to the POPRF service.
   * @param seed Seed for the blinding factor. Provided if deterministic blinding is needed.
   *   Note that, by design, if the same seed and message is used twice, the blinded message will be
   *   the same. This allows for linking between the two blinded messages and so only should be used
   *   if this is intended (e.g. to provide for retries of requests without consuming quota).
   */
  constructor(
    readonly publicKey: Uint8Array,
    readonly polynomial: Uint8Array,
    readonly tag: Uint8Array,
    readonly message: Uint8Array,
    readonly seed?: Uint8Array
  ) {
    super(publicKey, tag, message, seed)
  }

  /**
   * Given a blinded partial evaluation response, unblind and verify the evaluation share, returning the result.
   *
   * @param response A blinded partial evaluation response.
   * @returns a buffer with unblinded partial evaluation.
   *
   * @throws If the given response is invalid or cannot be verified against the public key, tag, and
   * blinding state present in this client.
   */
  public unblindPartialResponse(response: Uint8Array): Buffer {
    return Buffer.from(
      poprf.unblindPartialResp(this.polynomial, this.blindingFactor, this.tag, response)
    )
  }
}

export class PoprfServer {
  constructor(readonly privateKey: Uint8Array) {}

  /**
   * Evaluates the POPRF function over the tag and blinded message with the (complete) private key
   *
   * @param tag plaintext tag buffer to be combined with the blinded message in the POPRF.
   *
   * @returns a serialized blinded evaluation response.
   */
  public blindEval(tag: Uint8Array, blindedMessage: Uint8Array): Buffer {
    return Buffer.from(poprf.blindEval(this.privateKey, tag, blindedMessage))
  }
}

export class ThresholdPoprfServer {
  constructor(readonly privateKeyShare: Uint8Array) {}

  /**
   * Evaluates the POPRF function over the tag and blinded message with the private key share.
   *
   * @param tag plaintext tag buffer to be combined with the blinded message in the POPRF.
   *
   * @returns a serialized blinded partial evaluation response.
   */
  public blindPartialEval(tag: Uint8Array, blindedMessage: Uint8Array): Buffer {
    return Buffer.from(poprf.blindPartialEval(this.privateKeyShare, tag, blindedMessage))
  }
}
