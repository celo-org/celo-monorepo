import getConfig from 'next/config'
const CAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify'

enum Errors {
  MissingSecret = 'missing-input-secret',
  InvalidSecret = 'invalid-input-secret',
  MissingResponse = 'missing-input-response',
  InvalidResponse = 'invalid-input-response',
  BadRequest = 'bad-request',
  Timeout = 'timeout-or-duplicate',
}

interface RecaptchaResponse {
  success: boolean
  challenge_ts: string // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
  apk_package_name: string // the package name of the app where the reCAPTCHA was solved
  'error-codes'?: Errors[] // optional
}

export default async function captchaVerify(captchaToken: string): Promise<RecaptchaResponse> {
  const result = await fetch(CAPTCHA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${encodeURIComponent(
      getConfig().serverRuntimeConfig.RECAPTCHA_SECRET
    )}&response=${encodeURIComponent(captchaToken)}`,
  })

  return result.json()
}
