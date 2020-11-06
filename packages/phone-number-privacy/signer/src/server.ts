import { loggerMiddleware, rootLogger as logger } from '@celo/phone-number-privacy-common'
import express from 'express'
import fs from 'fs'
import https from 'https'
import * as PromClient from 'prom-client'
import { Histograms, Labels } from './common/metrics'
import config, { getVersion } from './config'
import { handleGetBlindedMessagePartialSig } from './signing/get-partial-signature'
import { handleGetQuota } from './signing/query-quota'

export function createServer() {
  logger.info('Creating express server')
  const app = express()
  app.use([express.json(), loggerMiddleware])

  app.get('/status', (_req, res) => {
    res.status(200).json({
      version: getVersion(),
    })
  })

  app.get('/metrics', (_req, res) => {
    res.send(PromClient.register.metrics())
  })

  // EG. curl -v "http://localhost:8080/getBlindedMessagePartialSig" -H "Authorization: 0xdaf63ea42a092e69b2001db3826bc81dc859bffa4d51ce8943fddc8ccfcf6b2b1f55d64e4612e7c028791528796f5a62c1d2865b184b664589696a08c83fc62a00" -d '{"hashedPhoneNumber":"0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96","blindedQueryPhoneNumber":"n/I9srniwEHm5o6t3y0tTUB5fn7xjxRrLP1F/i8ORCdqV++WWiaAzUo3GA2UNHiB","account":"0x588e4b68193001e4d10928660aB4165b813717C0"}' -H 'Content-Type: application/json'
  app.post('/getBlindedMessagePartialSig', async (_req, res) => {
    const end = Histograms.responseLatency.labels(Labels.sigEndpoint).startTimer()
    await handleGetBlindedMessagePartialSig(_req, res)
    end()
  })
  app.post('/getQuota', async (_req, res) => {
    const end = Histograms.responseLatency.labels(Labels.quotaEndpoint).startTimer()
    await handleGetQuota(_req, res)
    end()
  })

  const sslOptions = getSslOptions()
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
}

function getSslOptions() {
  const { sslKeyPath, sslCertPath } = config.server

  if (!sslKeyPath || !sslCertPath) {
    logger.info('No SSL configs specified')
    return null
  }

  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    logger.error('SSL cert files not found')
    return null
  }

  return {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  }
}
