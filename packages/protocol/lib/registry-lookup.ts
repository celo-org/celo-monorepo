import { Chain, decodeFunctionResult, encodeFunctionData, PublicClient, Transport } from 'viem'

export const REGISTRY_LOOKUP_ATTEMPTS = 3
export const REGISTRY_LOOKUP_RETRY_DELAY_MS = 2000

const registryGetAddressAbi = [
  {
    type: 'function',
    name: 'getAddressForString',
    inputs: [{ name: 'identifier', type: 'string' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

export type RegistryCallClient = Pick<PublicClient<Transport, Chain>, 'call'>

/**
 * Reads one name out of the registry.
 *
 * The registry answers an unregistered name with the zero address, so only a decoded
 * address is an answer: an RPC error, or a call that comes back with no data at all,
 * is retried and then reported. A caller that mistook either for the zero address would
 * treat a live contract as unregistered and give it a freshly deployed proxy.
 */
export async function lookupRegistryAddress(
  publicClient: RegistryCallClient,
  registryAddress: `0x${string}`,
  contract: string,
  attempts: number = REGISTRY_LOOKUP_ATTEMPTS,
  retryDelayMs: number = REGISTRY_LOOKUP_RETRY_DELAY_MS
): Promise<string> {
  const attempt = async (n: number): Promise<string> => {
    try {
      const callData = encodeFunctionData({
        abi: registryGetAddressAbi,
        functionName: 'getAddressForString',
        args: [contract],
      })
      const result = await publicClient.call({ to: registryAddress, data: callData })
      if (!result.data) {
        throw new Error('the call returned no data')
      }
      return decodeFunctionResult({
        abi: registryGetAddressAbi,
        functionName: 'getAddressForString',
        data: result.data,
      }) as string
    } catch (error) {
      if (n < attempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
        return attempt(n + 1)
      }
      throw new Error(
        `Registry lookup of ${contract} failed ${n} times; refusing to guess whether it is registered: ${error}`
      )
    }
  }
  return attempt(1)
}
