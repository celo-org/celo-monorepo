// tslint:disable: no-console
import threshold_bls from 'blind-threshold-bls'
import crypto from 'crypto'

const t = 3
const n = 4
console.log('Creating Threshold BLS keypairs with %s/%s ratio...', t, n)
console.log('USE ONLY FOR DEVELOPMENT OR TESTING')

const seed = crypto.randomBytes(32)
const keys = threshold_bls.thresholdKeygen(n, t, seed)
console.log('Private keys (hex):')
for (let i = 0; i < keys.numShares(); i++) {
  console.log('Key #%s: %s', i + 1, Buffer.from(keys.getShare(i)).toString('hex'))
}

console.log('Threshold Public key (hex):')
console.log(Buffer.from(keys.thresholdPublicKey).toString('hex'))

console.log('Polynomial (hex):')
console.log(Buffer.from(keys.polynomial).toString('hex'))
