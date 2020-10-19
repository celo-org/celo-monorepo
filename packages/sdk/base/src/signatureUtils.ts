export const POP_SIZE = 65

export interface Signer {
  sign: (message: string) => Promise<string>
}

// Uses a native function to sign (as signFn), most commonly `web.eth.sign`
export function NativeSigner(
  signFn: (message: string, signer: string) => Promise<string>,
  signer: string
): Signer {
  return {
    sign: async (message: string) => {
      return signFn(message, signer)
    },
  }
}

export interface Signature {
  v: number
  r: string
  s: string
}

export function serializeSignature(signature: Signature) {
  const serializedV = signature.v.toString(16)
  const serializedR = signature.r.slice(2)
  const serializedS = signature.s.slice(2)
  return '0x' + serializedV + serializedR + serializedS
}

export const SignatureBase = {
  NativeSigner,
  serializeSignature,
}
