import crypto from 'crypto'
import { hexToBuffer, trimLeading0x } from '../../../base/lib'
import { signWithRawKey } from './query'

const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'

describe(signWithRawKey, () => {
  it('Signs message digest', async () => {
    const msg = `${'a'.repeat(64)} + ${'b'.repeat(16)}`

    // NOTE: Elliptic will truncate the raw msg to 64 bytes before signing,
    // so make sure to always pass the hex encoded msgDigest instead.
    const msgDigest = crypto.createHash('sha256').update(JSON.stringify(msg)).digest('hex')

    // NOTE: elliptic is disabled elsewhere in this library to prevent
    // accidental signing of truncated messages.
    // tslint:disable-next-line:import-blacklist
    const EC = require('elliptic').ec
    const ec = new EC('secp256k1')

    // Sign
    const key = ec.keyFromPrivate(hexToBuffer(rawKey))
    const expectedSig = JSON.stringify(key.sign(msgDigest).toDER())
    const receivedSig = signWithRawKey(msg, rawKey)
    const badSig = JSON.stringify(key.sign(msg).toDER())

    // Verify
    const pub = key.getPublic(true, 'hex')
    const pubKey = ec.keyFromPublic(trimLeading0x(pub), 'hex')
    const isValid = (input: string, sig: string) => pubKey.verify(input, JSON.parse(sig))
    expect(isValid(msgDigest, expectedSig)).toBeTruthy()
    expect(isValid(msg, badSig)).toBeTruthy()
    expect(isValid(msg, expectedSig)).toBeFalsy()
    expect(isValid(msg, receivedSig)).toBeFalsy()
    expect(isValid(msgDigest, receivedSig)).toBeTruthy()
    expect(receivedSig).toEqual(expectedSig)
  })

  it('Signs full message', async () => {
    const msg1 = `${'a'.repeat(64)} + ${'b'.repeat(16)}`
    const msg2 = `${'a'.repeat(64)} + ${'c'.repeat(16)}`

    const sig1 = signWithRawKey(msg1, rawKey)
    const sig2 = signWithRawKey(msg2, rawKey)

    // NOTE: Elliptic will truncate the raw msg to 64 bytes before signing,
    // so make sure to always pass the hex encoded msgDigest instead.
    const msgDigest1 = crypto.createHash('sha256').update(JSON.stringify(msg1)).digest('hex')
    const msgDigest2 = crypto.createHash('sha256').update(JSON.stringify(msg2)).digest('hex')

    // NOTE: elliptic is disabled elsewhere in this library to prevent
    // accidental signing of truncated messages.
    // tslint:disable-next-line:import-blacklist
    const EC = require('elliptic').ec
    const ec = new EC('secp256k1')

    // Sign
    const key = ec.keyFromPrivate(hexToBuffer(rawKey))

    // Verify
    const pub = key.getPublic(true, 'hex')
    const pubKey = ec.keyFromPublic(trimLeading0x(pub), 'hex')
    const isValid = (input: string, sig: string) => pubKey.verify(input, JSON.parse(sig))
    expect(isValid(msgDigest1, sig1)).toBeTruthy()
    expect(isValid(msgDigest2, sig2)).toBeTruthy()
    expect(isValid(msgDigest1, sig2)).toBeFalsy()
    expect(isValid(msgDigest2, sig1)).toBeFalsy()
  })
})
