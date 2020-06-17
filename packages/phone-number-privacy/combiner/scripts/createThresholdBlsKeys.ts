// tslint:disable: no-console
import threshold_bls, { Keys } from 'blind-threshold-bls'
import crypto from 'crypto'

const t = 3
const n = 4
console.log('Creating Threshold BLS keypairs with %s/%s ratio...', t, n)

const blindedMessageString = 'nIQyL8z5aoz9CGEZ0O7ds+xsktQ7FX597FfYGnQChpG/UO7m2vCJnYDisNHjeZeB'
console.log('Blinded Message keys (base64): ' + blindedMessageString)
const blindedMessage = Buffer.from(blindedMessageString, 'base64')

const keys: Keys = threshold_bls.thresholdKeygen(n, t, crypto.randomBytes(32))
console.log('Private keys (hex):')
for (let i = 0; i < keys.numShares(); i++) {
  console.log('Key #%s: %s', i + 1, Buffer.from(keys.getShare(i)).toString('hex'))
  const signedMsg = threshold_bls.partialSignBlindedMessage(keys.getShare(i), blindedMessage)
  console.log(
    'Signed Message by Key #%s (base64): %s',
    i + 1,
    Buffer.from(signedMsg).toString('base64')
  )
}

console.log('Threshold Public key (hex):')
console.log(Buffer.from(keys.thresholdPublicKey).toString('hex'))

console.log('Polynomial (hex):')
console.log(Buffer.from(keys.polynomial).toString('hex'))
