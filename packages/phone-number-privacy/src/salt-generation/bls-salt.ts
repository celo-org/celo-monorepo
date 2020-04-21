import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import config from '../config'

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getSalt" -d '{"queryPhoneNumber": "xfVo/qxqTXWE8AXzev8KcqJ2CG8sMqNQfn/0X2ch7dKGJyBGG8YjhFyNSmX1e1cB9n4ARdq6kYr0vZTAebx1Nudl3zR9ij0aIJY5wzhsR89uLPj/31H0Ks4FMf42oD4A/5ny0+AA1As0oUFvTpVr99Uk4+GxbRjX/iHgTa2qkM15ih/3Qot/tw/vt9LmDZAByogwM3EAHZFC+BLyYfgt8Tws/2jwiie61wET0Ms/JLOVZjiTZafwJJ74Wqlk/IgAAA==", "account":"0x117ea45d497ab022b85494ba3ab6f52969bf6813", "phoneNumber":"+15555555555"}' -H 'Content-Type: application/json'
/*
 * Computes the BLS Salt for the blinded phone number.
 */
export function computeBLSSalt(queryPhoneNumber: string) {
  try {
    return Buffer.from(
      threshold.sign(
        new Uint8Array(new Buffer(config.salt.key, 'base64')),
        new Uint8Array(new Buffer(queryPhoneNumber, 'base64'))
      )
    ).toString('base64')
  } catch (e) {
    console.error(ErrorMessages.SALT_COMPUTATION_FAILURE, e)
    throw e
  }
}
