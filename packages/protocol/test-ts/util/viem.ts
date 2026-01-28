import { Abi, getContractAddress, Transaction } from 'viem'

export const deployViemContract = async (
  abi: Abi,
  bytecode: string,
  client,
  args = []
): Promise<string> => {
  const hash = await client.deployContract({
    abi,
    bytecode,
    args,
  })
  const tx: Transaction = await client.getTransaction({ hash })
  const address = getContractAddress({
    from: tx.from,
    nonce: BigInt(tx.nonce),
  })

  return address
}
