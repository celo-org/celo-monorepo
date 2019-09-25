const PIN_TIMEOUT = 300000 // 5 minutes

interface PincodeCache {
  timestamp: number | null
  pincode: string | null
}

const pincodeCache: PincodeCache = {
  timestamp: null,
  pincode: null,
}

export function getCachedPincode() {
  // TODO(Rossy) use a  monotonic clock here
  if (
    pincodeCache.pincode &&
    pincodeCache.timestamp &&
    Date.now() - pincodeCache.timestamp < PIN_TIMEOUT
  ) {
    return pincodeCache.pincode
  }
  return null
}

export function setCachedPincode(pincode: string) {
  pincodeCache.timestamp = Date.now()
  pincodeCache.pincode = pincode
}
