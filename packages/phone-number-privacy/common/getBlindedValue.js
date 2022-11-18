const threshold = require('blind-threshold-bls')
const btoa = require('btoa')

function getBlindedPhoneNumber(phoneNumber, blindingFactor) {
  const blindedPhoneNumber = threshold.blind(Buffer.from(phoneNumber), blindingFactor).message
  return uint8ArrayToBase64(blindedPhoneNumber)
}

function uint8ArrayToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// from common/src/test/values
const PHONE_NUMBER1 = '+15555555555'
const BLINDING_FACTOR1 = Buffer.from('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
const BLINDED_PHONE_NUMBER1 = getBlindedPhoneNumber(PHONE_NUMBER1, BLINDING_FACTOR1)
console.log(BLINDED_PHONE_NUMBER1)

// from combiner/test/end-to-end/resources
const PHONE_NUMBER2 = '+17777777777'
const BLINDING_FACTOR2 = Buffer.from('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
const BLINDED_PHONE_NUMBER2 = getBlindedPhoneNumber(PHONE_NUMBER2, BLINDING_FACTOR2)
console.log(BLINDED_PHONE_NUMBER2)
