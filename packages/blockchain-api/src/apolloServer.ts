import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { resolvers, typeDefs } from './schema'

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      blockscoutAPI: new BlockscoutAPI(),
    }
  },
})
