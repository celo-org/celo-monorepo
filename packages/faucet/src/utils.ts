import Web3 from 'web3'

export function withTimeLog<A>(name: string, f: (...args: any[]) => Promise<A>) {
  return async (...args: Parameters<typeof f>): Promise<A> => {
    try {
      console.time(name)
      return await f(...args)
    } finally {
      console.timeEnd(name)
    }
  }
}

export async function runWithTimeLog<A>(name: string, f: () => Promise<A>): Promise<A> {
  try {
    console.time(name)
    return await f()
  } finally {
    console.timeEnd(name)
  }
}

/**
 * Generates a temporary account and invite code.
 * TODO(joshua), figure out how to import this from `@celo/utils`
 */
export function generateInviteCode(): {
  address: string
  inviteCode: string
} {
  const web3 = new Web3()
  const tempAccount = web3.eth.accounts.create()
  const address = tempAccount.address
  const temporaryPrivateKey = tempAccount.privateKey
  // Buffer.from doesn't expect a 0x for hex input
  const inviteCode = Buffer.from(temporaryPrivateKey.substring(2), 'hex').toString('base64')
  return { address, inviteCode }
}
