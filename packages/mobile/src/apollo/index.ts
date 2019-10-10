import ApolloClient from 'apollo-boost'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { AsyncStorage } from 'react-native'
import introspectionQueryResultData from 'src/apollo/fragmentTypes.json'
import config from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

const cache = new InMemoryCache({ fragmentMatcher })

persistCache({
  cache,
  // @ts-ignore https://github.com/apollographql/apollo-cache-persist/pull/58
  storage: AsyncStorage,
}).catch((reason: string) => Logger.error('Apollo/index', `Failure to persist cache: ${reason}`))

export const apolloClient = new ApolloClient<InMemoryCache>({
  uri: config.blockchainApiUrl,
  cache,
})
