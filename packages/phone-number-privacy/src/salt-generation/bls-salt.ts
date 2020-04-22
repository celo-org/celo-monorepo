import { BLINDBLS } from 'bls12377js-blind'
import { ErrorMessages } from '../common/error-utils'
import config from '../config'

/*
 * Computes the BLS Salt for the blinded phone number.
 */
export function computeBLSSalt(queryPhoneNumber: string) {
  try {
    const privateKey = new Buffer(config.salt.key)
    return BLINDBLS.computePRF(privateKey, new Buffer(queryPhoneNumber))
  } catch (e) {
    console.error(ErrorMessages.SALT_COMPUTATION_FAILURE, e)
    throw e
  }
}
