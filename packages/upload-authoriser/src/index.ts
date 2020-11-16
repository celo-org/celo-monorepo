import { guessSigner } from '@celo/utils/lib/signatureUtils'
import { Storage } from '@google-cloud/storage'
import { toChecksumAddress } from 'ethereumjs-util'
import * as functions from 'firebase-functions'

const storage = new Storage()
const bucket = storage.bucket('celo-test-alexh-bucket')

const FIVE_MINUTES = 1000 * 60 * 5

interface UploadValidator {
  match: (path: string) => boolean
  range: () => [number, number]
}

const validators: UploadValidator[] = [
  {
    match: (path: string) => path === '/account/name' || path === '/account/name.enc',
    range: () => [0, 100],
  },
  {
    match: (path: string) => path === '/account/picture' || path === '/account/picture.enc',
    range: () => [0, 10000],
  },
  {
    match: (path: string) => path.endsWith('.signature'),
    range: () => [65, 65],
  },
  {
    match: (path: string) => !!path.match(/\/ciphertexts\/[a-fA-F0-9]+$/),
    range: () => [128, 130],
  },
]

export const authorize = functions.https.onCall(async (payload, context) => {
  const { rawRequest } = context

  const signature = rawRequest.get('Signature')
  if (!signature) {
    throw new functions.https.HttpsError('unauthenticated', 'Signature required')
  }

  let signer = ''
  try {
    signer = guessSigner(JSON.stringify(payload), signature)
  } catch (e) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid signature provided')
  }

  if (!Array.isArray(payload)) {
    throw new functions.https.HttpsError('failed-precondition', 'Request payload must be an array')
  }

  const signedUrls = await Promise.all(
    payload.map(({ path }) => {
      const validator = validators.find((v) => v.match(path))
      if (!validator) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid upload path specified')
      }

      const [min, max] = validator.range()

      const file = bucket.file(`${toChecksumAddress(signer)}${path}`)
      return file
        .generateSignedPostPolicyV4({
          expires: Date.now() + FIVE_MINUTES,
          conditions: [
            // TODO: get this to work
            // ['eq', '$Content-Type', 'application/octet-stream'],
            ['content-length-range', min, max],
          ],
        })
        .then(([policy]) => policy)
    })
  )

  return signedUrls
})
