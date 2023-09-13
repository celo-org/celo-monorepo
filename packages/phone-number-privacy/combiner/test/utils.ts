import threshold_bls from 'blind-threshold-bls'
import { Server } from 'http'
import { Server as HttpsServer } from 'https'

export function getBlindedPhoneNumber(phoneNumber: string, blindingFactor: Buffer): string {
  const blindedPhoneNumber = threshold_bls.blind(Buffer.from(phoneNumber), blindingFactor).message
  return Buffer.from(blindedPhoneNumber).toString('base64')
}

export async function serverClose(server?: Server | HttpsServer) {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
}
