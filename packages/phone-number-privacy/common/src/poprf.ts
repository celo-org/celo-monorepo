// Note that this import is only ever used for its type information. As a result, it will not be
// included in the compiled JavaScript or result in an import at runtime.
// https://www.typescriptlang.org/docs/handbook/modules.html#optional-module-loading-and-other-advanced-loading-scenarios
import * as POPRF from '@celo/poprf'
import { randomBytes } from 'crypto'

/**
 * @module
 * This module provides interfaces for the Pith POPRF. It allows the construction of client, server,
 * and combiner objects that wrap that package the required functionality.
 *
 * A partially-oblivious PRF (POPRF) is a protocol between a client and a server to evaluate the
 * keyed pseudo-random function F(k, t, m). The client provides the tag input, t, and message input,
 * m. The server provides the secret key input k. During the exchange the server learns the
 * client-provided tag, but gains no other information. In particular, they learn nothing about the
 * message. The client learns the output of the PRF function F, but no other information about the
 * secret key held by the server.
 *
 * Implementation of the POPRF can be found in the following repository:
 * https://github.com/celo-org/celo-poprf-rs
 */

// tslint:disable: max-classes-per-file

let _poprf: typeof POPRF | undefined

/**
 * Lazy loading function for the POPRF WASM implementation dependency.
 *
 * @remarks @celo/poprf version 0.1.x is compiled to a WASM is around 320 kB. Note that this must be
 * loaded into memory at runtime. In order to avoid that cost, both on-disk and in memory, for users
 * that do not need the POPRF functionality, it is loaded lazily, and included only as a dev
 * dependency for clients that do not need it. If a package wants to utilize the POPRF
 * functionality, it should add @celo/poprf to its dependencies (i.e. package.json).
 */
function poprf(): typeof POPRF {
  // TODO: This will only initially work in Node environments. If we want to have this work in
  // ReactNative and browser environments, some work will need to be done in @celo/poprf or here.
  if (_poprf === undefined) {
    try {
      _poprf = require('@celo/poprf')
    } catch {
      throw new Error('@celo/poprf not available. Add it to the package.json')
    }
  }
  return _poprf!
}

/** Client for an instance of the POPRF protocol interacting with a POPRF service. */
export class PoprfClient {
  /** Blinded message to be sent to the POPRF service for evaluation */
  public readonly blindedMessage: Buffer

  /** Secret blinding factor used for blinding and response verification. */
  protected readonly blindingFactor: Buffer

  /**
   * Constructs POPRF client state, blinding the given message and saving the public key, blinding
   * factor, and tag for use in verification and unbinding of the response.
   *
   * @remarks Note that this client represents the client-side of a single protocol exchange.
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
    const blinded = poprf().blindMsg(message, seed ?? randomBytes(32))

    // Save the blinding factor to the class state so that unblind can use it.
    this.blindingFactor = Buffer.from(blinded.blindingFactor)
    this.blindedMessage = Buffer.from(blinded.blindedMessage)
  }

  /**
   * Given a blinded evaluation response, unblind and verify the evaluation, returning the result.
   *
   * @remarks Note that this function expects a complete/aggregated response, and not a partial
   * response as is returned by an individual server in a threshold service implementation. If the
   * client wishes to unblind and verify partial responses, they will need to use the
   * ThresholdPoprfClient.
   *
   * @param response A blinded evaluation response.
   * @returns a buffer with the final POPRF output.
   *
   * @throws If the given response is invalid or cannot be verified against the public key, tag, and
   * blinding state present in this client.
   */
  public unblindResponse(response: Uint8Array): Buffer {
    return Buffer.from(poprf().unblindResp(this.publicKey, this.blindingFactor, this.tag, response))
  }
}

/**
 * Combiner for an instance of the POPRF protocol acting as a relayer between the client and
 * threshold service operators. A combiner effectively combines a set of service operators to appear
 * as a single service.
 *
 * @remarks In the Pith POPRF protocol, verification occurs as part of the unblinding process and
 * therefore only the client and determine is a given response is valid. As a result, the combiner
 * cannot determine whether the responses from the service as correct, as long as they are
 * well-formed.
 */
export class PoprfCombiner {
  constructor(readonly threshold: number) {
    if (threshold % 1 !== 0) {
      throw new Error('POPRF threshold must be an integer')
    }
  }

  /**
   * If there are enough responses provided, aggregates the collection of blind partial evaluations
   * to a single blind threshold evaluation.
   *
   * @param response An array of blinded partial evaluation responses.
   * @remarks Does not verify any of the responses. Verification only occurs during unblinding.
   *
   * @returns A buffer with a blind aggregated POPRF evaluation response, or undefined if there are
   * less than the threshold number of responses provided.
   */
  public blindAggregate(blindedResponses: Uint8Array[]): Buffer | undefined {
    if (blindedResponses.length < this.threshold) {
      return undefined
    }

    return Buffer.from(
      poprf().blindAggregate(this.threshold, Buffer.concat(blindedResponses.map(Buffer.from)))
    )
  }

  /**
   * If there are enough responses provided, aggregates the collection of partial evaluations
   * to a single POPRF evaluation.
   *
   * @param response An array of partial evaluation responses.
   * @returns A buffer with a POPRF evaluation, or undefined if there are less than the threshold
   * number of responses provided.
   */
  public aggregate(responses: Uint8Array[]): Buffer | undefined {
    if (responses.length < this.threshold) {
      return undefined
    }

    return Buffer.from(poprf().aggregate(this.threshold, Buffer.concat(responses.map(Buffer.from))))
  }
}

/**
 * Client for interacting with a threshold implementation of the POPRF service without a combiner.
 *
 * @privateRemarks
 * TODO Combine this class with the functionality from the combiner to create a POPRF client
 * that can handle expunging bad partial evaluations from a set of responses.
 */
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
      poprf().unblindPartialResp(this.polynomial, this.blindingFactor, this.tag, response)
    )
  }
}

/**
 * Server for the POPRF protocol for answering queries from clients.
 *
 * @remarks Note that, unlike the client, the server object is stateless and may be used for
 * multiple protocol exchanges, including being used concurrently.
 */
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
    return Buffer.from(poprf().blindEval(this.privateKey, tag, blindedMessage))
  }
}

/**
 * Server for a threshold implementation of the POPRF protocol for answering queries from clients.
 *
 * @remarks Note that, unlike the client, the server object is stateless and may be used for
 * multiple protocol exchanges, including being used concurrently.
 */
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
    return Buffer.from(poprf().blindPartialEval(this.privateKeyShare, tag, blindedMessage))
  }
}
