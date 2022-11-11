import threshold_bls from 'blind-threshold-bls'

console.log('using new utils')
export function getBlindedPhoneNumber(phoneNumber: string, blindingFactor: Buffer): string {
  const blindedPhoneNumber = threshold_bls.blind(Buffer.from(phoneNumber), blindingFactor).message
  return Buffer.from(blindedPhoneNumber).toString('base64')
}
