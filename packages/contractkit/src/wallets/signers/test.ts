// import { publicKeyToAddress } from '@celo/utils/lib/address'
// import * as asn1 from 'asn1js'
// import { KMS } from 'aws-sdk'
// import * as ethUtil from 'ethereumjs-util'

// const KeyId = '1d6db902-9a45-4dd5-bd1e-7250b2306f18'
// const SigningAlgorithm = 'ECDSA_SHA_256'
// const Message = Buffer.from('hello there')

// function toArrayBuffer(buffer: Buffer): ArrayBuffer {
//   const ab = new ArrayBuffer(buffer.length)
//   const view = new Uint8Array(ab)
//   for (let i = 0; i < buffer.length; ++i) {
//     view[i] = buffer[i]
//   }
//   return ab
// }

// const kms = new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })

// async function main() {
//   console.log('got kms')

//   console.log('signing', Message.toString())
//   console.log(await kms.listKeys().promise())
//   const { Signature } = await kms
//     .sign({
//       KeyId,
//       Message,
//       SigningAlgorithm,
//     })
//     .promise()

//   const { PublicKey } = await kms.getPublicKey({ KeyId }).promise()
//   const { result } = asn1.fromBER(toArrayBuffer(PublicKey as Buffer))
//   const values = (result as asn1.Sequence).valueBlock.value
//   const value = values[1] as asn1.BitString
//   const newPublicKey = Buffer.from(value.valueBlock.valueHex.slice(1))

//   console.log('>>>', newPublicKey)
//   console.log('> hex', PublicKey?.toString('hex'))
//   console.log('> base64', PublicKey?.toString('base64'))
//   console.log('> base64', (PublicKey as Buffer).length)
//   console.log(ethUtil.isValidPublic(newPublicKey))
//   console.log(publicKeyToAddress(newPublicKey.toString('hex')))

//   const verifyResult = await kms
//     .verify({ KeyId, Signature: Signature!, Message, SigningAlgorithm })
//     .promise()
//   console.log('>', verifyResult)

//   // console.log(await kms.describeKey({ KeyId: 'f276faae-3c32-4c53-939b-063fdde06f27' }).promise())
//   // console.log('sig', result.Signature?.toString('base64'))
// }

// main()
