import * as poprf from '@celo/poprf'
import {
  PoprfClient,
  PoprfCombiner,
  PoprfServer,
  ThresholdPoprfClient,
  ThresholdPoprfServer,
} from '../src/poprf'

const TEST_POPRF_KEYPAIR = poprf.keygen(Buffer.from('TEST POPRF KEYPAIR SEED'))
const TEST_THRESHOLD_N = 3
const TEST_THRESHOLD_T = 2
const TEST_THRESHOLD_POPRF_KEYS = poprf.thresholdKeygen(
  TEST_THRESHOLD_N,
  TEST_THRESHOLD_T,
  Buffer.from('TEST THRESHOLD POPRF KEYPAIR SEED')
)

const TEST_MESSAGE_A = Buffer.from('TEST MESSAGE A')
const TEST_MESSAGE_B = Buffer.from('TEST MESSAGE B')
const TEST_TAG_A = Buffer.from('TEST TAG A')
const TEST_TAG_B = Buffer.from('TEST TAG B')
const TEST_BLINDING_SEED = Buffer.from('TEST BLINDING SEED')

describe('PoprfClient', () => {
  it('results in a different blinding when called multiple times without a seed', () => {
    const clientA = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)
    const clientB = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)
    expect(clientA.blindedMessage).not.toEqual(clientB.blindedMessage)
  })

  it('results in the same blinding when called multiple times with the same message and seed', () => {
    const clientA = new PoprfClient(
      TEST_POPRF_KEYPAIR.publicKey,
      TEST_TAG_A,
      TEST_MESSAGE_A,
      TEST_BLINDING_SEED
    )
    const clientB = new PoprfClient(
      TEST_POPRF_KEYPAIR.publicKey,
      TEST_TAG_A,
      TEST_MESSAGE_A,
      TEST_BLINDING_SEED
    )
    expect(clientA.blindedMessage).toEqual(clientB.blindedMessage)
  })
})

describe('end-to-end', () => {
  it('successfully completes client-server exchange', () => {
    const server = new PoprfServer(TEST_POPRF_KEYPAIR.privateKey)
    const client = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)

    const response = server.blindEval(client.tag, client.blindedMessage)
    const evaluation = client.unblindResponse(response)

    // POPRF hashed outputs should be 32 bytes.
    expect(evaluation.length).toEqual(32)
    expect(evaluation.toString('base64')).toEqual('Oh4FGO2zJ/jZDLkpW4LJk3xr5RdIHg0mYuGg2/b44+s=')
  })

  it('client rejects a exchange when the server uses the wrong key', () => {
    const badPrivateKey = poprf.keygen(Buffer.from('BAD POPRF KEYPAIR SEED')).privateKey
    const server = new PoprfServer(badPrivateKey)
    const client = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)

    const response = server.blindEval(client.tag, client.blindedMessage)
    expect(() => client.unblindResponse(response)).toThrow(/verification failed/)
  })

  it('client rejects a exchange when the server uses the wrong tag', () => {
    const server = new PoprfServer(TEST_POPRF_KEYPAIR.privateKey)
    const client = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)

    const response = server.blindEval(TEST_TAG_B, client.blindedMessage)
    expect(() => client.unblindResponse(response)).toThrow(/verification failed/)
  })

  it('client rejects a exchange when the server uses the wrong message', () => {
    const server = new PoprfServer(TEST_POPRF_KEYPAIR.privateKey)
    const client = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_A)

    const badMessage = new PoprfClient(TEST_POPRF_KEYPAIR.publicKey, TEST_TAG_A, TEST_MESSAGE_B)
      .blindedMessage

    const response = server.blindEval(TEST_TAG_A, badMessage)
    expect(() => client.unblindResponse(response)).toThrow(/verification failed/)
  })

  it('successfully completes client-server exchange with combiner', () => {
    const servers = [...Array(TEST_THRESHOLD_N).keys()].map(
      (i) => new ThresholdPoprfServer(TEST_THRESHOLD_POPRF_KEYS.getShare(i))
    )
    const combiner = new PoprfCombiner(TEST_THRESHOLD_T)
    const client = new PoprfClient(
      TEST_THRESHOLD_POPRF_KEYS.thresholdPublicKey,
      TEST_TAG_A,
      TEST_MESSAGE_A
    )

    const blindedPartials = servers.map((s) =>
      s.blindPartialEval(client.tag, client.blindedMessage)
    )
    const response = combiner.blindAggregate(blindedPartials)
    expect(response).toBeDefined()
    if (response === undefined) {
      throw new Error('response is undefined')
    }
    const evaluation = client.unblindResponse(response)

    // POPRF hashed outputs should be 32 bytes.
    expect(evaluation.length).toEqual(32)
    expect(evaluation.toString('base64')).toEqual('C1jKGStMWC3lNpYDV61D+3waetY0bHlD4ElYzV+Isqc=')
  })

  it('successfully completes client-server exchange with threshold client and server', () => {
    const servers = [...Array(TEST_THRESHOLD_N).keys()].map(
      (i) => new ThresholdPoprfServer(TEST_THRESHOLD_POPRF_KEYS.getShare(i))
    )
    const client = new ThresholdPoprfClient(
      TEST_THRESHOLD_POPRF_KEYS.thresholdPublicKey,
      TEST_THRESHOLD_POPRF_KEYS.polynomial,
      TEST_TAG_A,
      TEST_MESSAGE_A
    )

    const blindedPartials = servers.map((s) =>
      s.blindPartialEval(client.tag, client.blindedMessage)
    )
    const partials = blindedPartials.map((r) => client.unblindPartialResponse(r))
    expect(partials.map((p) => p.toString('base64'))).toEqual([
      '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',
    ])

    const combiner = new PoprfCombiner(TEST_THRESHOLD_T)
    const evaluation = combiner.aggregate(partials)
    expect(evaluation).toBeDefined()
    if (evaluation === undefined) {
      throw new Error('evaluation is undefined')
    }

    // POPRF hashed outputs should be 32 bytes.
    expect(evaluation.length).toEqual(32)
    expect(evaluation.toString('base64')).toEqual('C1jKGStMWC3lNpYDV61D+3waetY0bHlD4ElYzV+Isqc=')
  })
})
