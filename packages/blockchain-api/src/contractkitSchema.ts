import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { gql } from 'apollo-server-express'
import { DataSources } from './apolloServer'

export const typeDefs = gql`
  type ReleaseGoldContract {
    address: String!
    totalBalance: String!
    totalWithdrawn: String!
  }

  type Query {
    releaseGold(address: String!): ReleaseGoldContract
  }
`

interface Context {
  dataSources: DataSources
  localCurrencyCode?: string
}

export const resolvers = {
  Query: {
    releaseGold: async (
      _source: any,
      args: { address: string },
      { dataSources: { contractKit } }: Context
    ) => {
      const res = await contractKit.fetchFromCache(
        `query.releasegold.${args.address}`,
        async () => {
          const kit = contractKit.kit
          const address = args.address as string
          const contract = new ReleaseGoldWrapper(kit, newReleaseGold(kit.web3, address))
          return JSON.stringify({
            address,
            totalBalance: await contract.getTotalBalance(),
            totalWithdrawn: await contract.getTotalWithdrawn(),
          })
        }
      )
      return JSON.parse(res)
    },
  },
}
