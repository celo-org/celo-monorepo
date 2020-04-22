import { computeBlindedSignature } from '../../src/salt-generation/bls-signature'

describe(`BLS service computes signature`, () => {
  it('provides blinded signature', () => {
    const expected =
      'lwB9ct0qGQqAYeRO2l6G3BRGmhxJcNn+Fc7/eCq0MtrVfOSKBT32R2p7Za4E31AA6xLw+5Uzg9dCmj8lXlq4oeC5t4Zn2Bx7Ce9py2ZPlzNST2PAx/sebKkG90P6WTcB82t977G0/09vFhof3lKSht5tClbbxsXTsOrOn6RDh/0/DT1ibAlURR4O8oxaFCcBrhVfMyFcWWa+HNeILPYMDk+okRGD0CnLMDsQHPG2kjetEaKPYPPhcf82rv0IFUIAAA=='
    const blindPhoneNumberString =
      'TX4Cj9xe1Py0sMClZrk2QsoSmdToZueU7T/6YB4o8jKLEAXaSnO/PeeHvz7KVpQAhPB/E/B9AT7C6zVCeDyfIxcHEaNlS9ZQsfTa7ProhLDNMKxcMzytH9a5U8ousbUAf9SRIXQQiWT6W7dZH4vP1pcU7kz4N+UgPENdZWhUhXVq4o1FlEyNbXctN8f2cJMAVg1A77hcQHR3Nv2ZEU0UnlykquNxufF+KNwqMXUFylPPyJDtSKwi2C0DuRYs8U8AAA=='

    expect(JSON.stringify(computeBlindedSignature(blindPhoneNumberString))).toEqual(
      JSON.stringify(expected)
    )
  })
})
