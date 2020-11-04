import express from 'express'
import { server as apolloServer } from './apolloServer'

declare var process: {
  env: {
    PORT: string
    INTERFACE: string
  }
}

const GRAPHQL_PATH: string = '/'

const PORT: number = Number(process.env.PORT) || 8080
const INTERFACE: string = process.env.INTERFACE || '0.0.0.0'

const app = express()

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

app.head('/', (_req, res) => {
  // Preventing HEAD requests made by some browsers causing alerts
  // https://github.com/celo-org/celo-monorepo/issues/2189
  res.end()
})

apolloServer.applyMiddleware({ app, path: GRAPHQL_PATH })

app.listen(PORT, INTERFACE, () => {
  console.info(`🚀 GraphQL accessible @ http://${INTERFACE}:${PORT}${apolloServer.graphqlPath}`)
  console.info('[Celo] Starting Server')
})
