import { HttpLink } from 'apollo-link-http'
import { ApolloServer } from 'apollo-server-express'
import fetch from 'cross-fetch'
import {
  introspectSchema,
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  mergeSchemas,
} from 'graphql-tools'
import { BlockscoutAPI } from './blockscout'
import { BLOCKSCOUT_API, WEB3_PROVIDER_URL } from './config'
import ContractKitDataSouce from './contractKitDataSource'
import { resolvers as ckResolvers, typeDefs as ckTypeDefs } from './contractkitSchema'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import { resolvers, typeDefs } from './walletSchema'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  currencyConversionAPI: CurrencyConversionAPI
  contractKit: ContractKitDataSouce
}

export async function stitchedServer() {
  const link = new HttpLink({ uri: BLOCKSCOUT_API, fetch })
  const schema = await introspectSchema(link)
  const blockscoutSchema = makeRemoteExecutableSchema({
    schema,
    link,
  })

  const legacySchema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  const contractKitSchema = makeExecutableSchema({
    typeDefs: ckTypeDefs,
    resolvers: ckResolvers,
  })

  const mergedSchema = mergeSchemas({
    subschemas: [blockscoutSchema, legacySchema, contractKitSchema],
  })

  return new ApolloServer({
    uploads: false,
    schema: mergedSchema,
    dataSources: () => {
      return {
        blockscoutAPI: new BlockscoutAPI(),
        currencyConversionAPI: new CurrencyConversionAPI(),
        contractKit: new ContractKitDataSouce(WEB3_PROVIDER_URL as string),
      }
    },
  })
}
