import threshold from 'blind-threshold-bls'
import { computeBlindedSignature } from '../../src/bls/bls-signature'

describe(`BLS service computes signature`, () => {
  const publicKey =
    'dbEqcQSsJIH0Gt3R/V6gPCmESkBAMq6QWvkIgJmZQgpZvKl3h0OhiHLmy15iOb0AwCpVo/4+frHYxeE3d4y59bv/zGawOcKGXvwPO/uVDEMl9erd4vXkGCH1curZ/VcAAA=='

  it('provides blinded signature', () => {
    const message = Buffer.from('hello world')
    const blindingFactor = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
    const blindMessage =
      'y0mfrunrG5dqLZ4IczVwVudGMbmKfUdaUOExWJzKpGFxpfRSd5741kxkPiVd7qQBdS1FTEjdc1d6UWygEBqGPuC79xuiRCPLbduBRBN5NU/rGDLKPIH/F/o4pLjTBWcAHrneLRZkO79Wy1cHJkNXXmQs7HPa+b4Nrr0o8kjuQn0JSQe1G6dn4YoQ8S/KbSIB+XWFCwCtR38o6ioY8JuGJCqI/RPH+9pJPKUnIf3BovqpMaOoT/pW6qSqA+fLs6MAAA=='

    const expected =
      'fdEWblEu455L9Svfx/HGHZRc2xwnWxYHH7OMwV4+Ox5F/Y5ggHQeTpkofsZrSAEAXqxgqivJ0pHDy+5Z/7YqwPQWcGDqXn994lA4COTwMY/FbsUF9GgYzzGnYbSQE0YA756IYi30RSGwJqeG9ZIpJ+iNdt6y2qNyFk2lNsJTtr+zGgM+pZgnhvrIel5GlRIBhNPTjDfl2NYmXx7B98DD1+FsvaQ6N50tYms0490mDrMRJuoD0vbkW2HVy/uL33IAAA=='

    const actual = computeBlindedSignature(blindMessage)
    expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected))

    const unblindedSignedMessage = threshold.unblind(new Buffer(actual, 'base64'), blindingFactor)
    expect(threshold.verify(new Buffer(publicKey, 'base64'), message, unblindedSignedMessage))
  })
})
