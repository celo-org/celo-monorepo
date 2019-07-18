import ApolloClient from 'apollo-boost'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { AsyncStorage } from 'react-native'
import { BLOCKCHAIN_API_URL } from 'src/utils/config'

const introspectionQueryResultData = {
  __schema: {
    types: [
      {
        kind: 'UNION',
        name: 'Event',
        possibleTypes: [{ name: 'Transfer' }],
      },
    ],
  },
}

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

const cache = new InMemoryCache({ fragmentMatcher })

persistCache({
  cache,
  storage: AsyncStorage,
})

export const apolloClient = new ApolloClient<InMemoryCache>({
  uri: BLOCKCHAIN_API_URL,
  cache,
})
