import express from 'express'
import { server as apolloServer } from './apolloServer'

declare var process: {
  env: {
    PORT: string
  }
}

const GRAPHQL_PATH: string = '/'

const PORT: number = Number(process.env.PORT) || 8080

const app: any = express()

app.get('/robots.txt', (req: express.Request, res: express.Response) => {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

app.head('/', (req: express.Request, res: express.Response) => {
  // Preventing HEAD requests made by some browsers causing alerts
  // https://github.com/celo-org/celo-monorepo/issues/2189
  res.end()
})

apolloServer.applyMiddleware({ app, path: GRAPHQL_PATH })

app.listen(PORT, () => {
  console.info(`🚀 GraphQL accessible @ http://localhost:${PORT}${apolloServer.graphqlPath}`)
  console.info('[Celo] Starting Server')
})
