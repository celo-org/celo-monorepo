// tslint:disable: no-console
import threshold_bls from 'blind-threshold-bls'
import crypto from 'crypto'

console.log('Creating BLS keypair...')

const seed = crypto.randomBytes(32)
const keypair = threshold_bls.keygen(seed)
const privateKey = keypair.privateKey
const publicKey = keypair.publicKey

console.log('Private key (base64):')
console.log(Buffer.from(privateKey).toString('base64'))
console.log('Public key (base64):')
console.log(Buffer.from(publicKey).toString('base64'))
