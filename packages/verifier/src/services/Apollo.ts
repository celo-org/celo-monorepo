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

// TODO what should happen if this fails???
persistCache({
  cache,
  storage: AsyncStorage,
}).catch((err) => {
  console.error('Apollo.persistCache error', err)
})

export const apolloClient = new ApolloClient<InMemoryCache>({
  uri: BLOCKCHAIN_API_URL,
  cache,
})
