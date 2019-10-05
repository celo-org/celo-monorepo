import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { CurrencyConversionAPI } from './currencyConversion'
import { resolvers, typeDefs } from './schema'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  currencyConversionAPI: CurrencyConversionAPI
}

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      blockscoutAPI: new BlockscoutAPI(),
      currencyConversionAPI: new CurrencyConversionAPI(),
    }
  },
})
