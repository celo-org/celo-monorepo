import { Abi, getContractAddress } from 'viem'

export const deployViemContract = async (
  abi: Abi,
  bytecode: string,
  client: any
): Promise<string> => {
  const hash = await client.deployContract({
    abi,
    bytecode,
  })
  const tx = await client.getTransaction({ hash })
  const address = getContractAddress({
    from: tx.from,
    nonce: BigInt(tx.nonce),
  })

  return address
}
