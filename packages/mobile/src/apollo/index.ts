import AsyncStorage from '@react-native-community/async-storage'
import ApolloClient from 'apollo-boost'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { introspectionQueryResultData } from 'src/apollo/types'
import config from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'

export const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

export const cache = new InMemoryCache({ fragmentMatcher })

persistCache({
  cache,
  // @ts-ignore https://github.com/apollographql/apollo-cache-persist/pull/58
  storage: AsyncStorage,
}).catch((reason: string) => Logger.error('Apollo/index', `Failure to persist cache: ${reason}`))

export const apolloClient = new ApolloClient<InMemoryCache>({
  uri: config.blockchainApiUrl,
  cache,
})
