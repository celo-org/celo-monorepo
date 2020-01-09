import bodyParser from 'body-parser'
import compression from 'compression'
import slashes from 'connect-slashes'
import express from 'express'
import expressEnforcesSsl from 'express-enforces-ssl'
import helmet from 'helmet'
import next from 'next'
import nextI18NextMiddleware from 'next-i18next/middleware'
import { Tables } from '../fullstack/EcoFundFields'
import addToCRM from '../server/addToCRM'
import ecoFundSubmission from '../server/EcoFundApp'
import Sentry, { initSentryServer } from '../server/sentry'
import { RequestType } from '../src/fauceting/FaucetInterfaces'
import nextI18next from '../src/i18n'
import latestAnnouncements from './Announcement'
import getAssets from './AssetBase'
import { faucetOrInviteController } from './controllers'
import getFormattedEvents from './EventHelpers'
import { submitFellowApp } from './FellowshipApp'
import getContributors from './getContributors'
import mailer from './mailer'
import { getFormattedMediumArticles } from './mediumAPI'
const port = parseInt(process.env.PORT, 10) || 3000

const dev = process.env.NEXT_DEV === 'true'
const app = next({ dev })
const handle = app.getRequestHandler()

// Strip the leading "www." prefix from the domain
function wwwRedirect(req: express.Request, res: express.Response, nextAction: () => unknown) {
  if (req.headers.host.startsWith('www.')) {
    const newHost = req.headers.host.slice(4)
    return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl)
  }
  nextAction()
}

;(async () => {
  await app.prepare()
  const server = express()

  server.use(helmet())
  server.use(wwwRedirect)
  server.enable('trust proxy')
  server.use(compression())
  server.use(slashes(false))

  if (!dev) {
    server.use(expressEnforcesSsl())
  }

  // page redirects
  ;['/careers', '/join'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/jobs')
    })
  })
  ;['/about-us'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/about')
    })
  })
  ;['/arg_tos', '/arg_privacy', '/argentina'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/terms')
    })
  })
  ;['/applications', '/technology', '/dev', '/developer'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/build')
    })
  })
  ;['/download', '/app', '/mobile-app', '/invite', 'build/download'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/build/wallet')
    })
  })

  server.get('/brand', (_, res) => {
    res.redirect('/experience/brand')
  })

  server.get('/connect', (_, res) => {
    res.redirect('/community')
  })

  server.get('/tos', (_, res) => {
    res.redirect('/user-agreement')
  })

  server.get('/stake-off', (_, res) => {
    res.redirect('https://forum.celo.org/t/the-great-celo-stake-off-the-details/136')
  })

  server.use(bodyParser.json())
  server.use(nextI18NextMiddleware(nextI18next))

  server.post('/fellowship', async (req, res) => {
    const { ideas, email, name, bio, deliverables, resume } = req.body

    try {
      const fellow = await submitFellowApp({
        name,
        email,
        ideas,
        bio,
        deliverables,
        resume,
      })
      res.status(204).json({ id: fellow.id })
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setTag('Service', 'Airtable')
        Sentry.captureException(e)
      })
      respondToError(res, e)
    }
  })

  server.post('/ecosystem/:table', async (req, res) => {
    try {
      const record = await ecoFundSubmission(req.body, req.params.table as Tables)
      res.status(204).json({ id: record.id })
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setTag('Service', 'Airtable')
        Sentry.captureEvent(e)
      })
      respondToError(res, e)
    }
  })

  server.post('/faucet', async (req, res) => {
    await faucetOrInviteController(req, res, RequestType.Faucet)
  })

  server.post('/invite', async (req, res) => {
    await faucetOrInviteController(req, res, RequestType.Invite)
  })

  server.post('/contacts', async (req, res) => {
    await addToCRM(req.body)
    res.status(204).send('ok')
  })

  server.get('/announcement', async (_, res) => {
    try {
      const annoucements = await latestAnnouncements()
      res.json(annoucements)
    } catch (e) {
      respondToError(res, e)
    }
  })

  server.get('/api/contributors', async (_, res) => {
    try {
      const assets = await getContributors()
      res.json(assets)
    } catch (e) {
      respondToError(res, e)
    }
  })

  server.get('/brand/api/assets/:asset', async (req, res) => {
    try {
      const assets = await getAssets(req.params.asset)
      res.json(assets)
    } catch (e) {
      respondToError(res, e)
    }
  })

  server.post('/partnerships-email', async (req, res) => {
    const { email } = req.body
    await mailer({
      toName: 'Team Celo',
      toEmail: 'partnerships@celo.org',
      fromEmail: 'partnerships@celo.org',
      subject: `New Partnership Email: ${email}`,
      text: email,
    })
    res.status(204).send('ok')
  })

  server.get('/proxy/medium', async (_, res) => {
    try {
      const articlesdata = await getFormattedMediumArticles()
      res.json(articlesdata)
    } catch (e) {
      respondToError(res, e)
    }
  })

  server.get('/proxy/events/', async (_, res) => {
    try {
      const events = await getFormattedEvents()
      res.json(events)
    } catch (e) {
      respondToError(res, e)
    }
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  await initSentryServer()
  await server.listen(port)

  // tslint:disable-next-line
  console.log(`> Ready on http://localhost:${port}`)
})()

function respondToError(res: express.Response, error: { message: string; statusCode: number }) {
  res.status(error.statusCode || 500).json({ message: error.message || 'unknownError' })
}
