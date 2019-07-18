import express from 'express'
import * as PromClient from 'prom-client'
import { pollBlockchain } from 'src/blockchain'

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection', error.message)
  process.exit(1)
})

const host = process.env.WEB3_PROVIDER
if (host === undefined) {
  console.error('WEB3_PROVIDER was not defined')
  process.exit(1)
}
try {
  pollBlockchain(host)
} catch (error) {
  console.error('Error happened during #pollBlockchain')
  console.error(error)
  process.exit(1)
}

const app = express()
const port = 3000

app.get('/status', (_req, res) => res.send('im up'))
app.get('/metrics', (_req, res) => {
  res.send(PromClient.register.metrics())
})
app.listen(port, () => console.log(`Transaction Metrics exporter starting on ${port}!`))
