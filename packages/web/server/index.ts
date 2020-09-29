import bodyParser from 'body-parser'
import compression from 'compression'
import slashes from 'connect-slashes'
import express from 'express'
import expressEnforcesSsl from 'express-enforces-ssl'
import helmet from 'helmet'
import next from 'next'
import path from 'path'
import { Tables } from '../fullstack/EcoFundFields'
import addToCRM from '../server/addToCRM'
import ecoFundSubmission from '../server/EcoFundApp'
import Sentry, { initSentryServer } from '../server/sentry'
import { RequestType } from '../src/fauceting/FaucetInterfaces'
import { create } from './Alliance'
import latestAnnouncements from './Announcement'
import { faucetOrInviteController } from './controllers'
import getFormattedEvents from './EventHelpers'
import { submitFellowApp } from './FellowshipApp'
import mailer from './mailer'
import rateLimit from './rateLimit'
import respondError from './respondError'

const CREATED = 201
const NO_CONTENT = 204
const MOVED_PERMANENTLY = 301

const port = parseInt(process.env.PORT, 10) || 3000

const dev = process.env.NEXT_DEV === 'true'
const app = next({ dev })
const handle = app.getRequestHandler()

// Strip the leading "www." prefix from the domain
function wwwRedirect(req: express.Request, res: express.Response, nextAction: () => unknown) {
  if (req.headers.host.startsWith('www.')) {
    const newHost = req.headers.host.slice(4)
    return res.redirect(MOVED_PERMANENTLY, req.protocol + '://' + newHost + req.originalUrl)
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
  ;['/careers', '/join'].forEach((route) => {
    server.get(route, (_, res) => {
      res.redirect('/jobs')
    })
  })
  ;['/about-us'].forEach((route) => {
    server.get(route, (_, res) => {
      res.redirect('/about')
    })
  })
  ;['/arg_tos', '/arg_privacy', '/argentina'].forEach((route) => {
    server.get(route, (_, res) => {
      res.redirect('/terms')
    })
  })
  ;['/applications', '/technology', '/dev', '/devs', '/develop', '/build', '/developer'].forEach(
    (route) => {
      server.get(route, (_, res) => {
        res.redirect('/developers')
      })
    }
  )
  ;['/build/validators'].forEach((route) => {
    server.get(route, (_, res) => {
      res.redirect('/validators/explore')
    })
  })

  server.get('/build/*', (req, res) => {
    res.redirect(`/developers/${req.params[0]}`)
  })
  ;['/test-wallet', 'build/download'].forEach((route) => {
    server.get(route, (_, res) => {
      res.redirect('/developers/wallet')
    })
  })

  server.get('/papers/stability', (_, res) => {
    res.redirect('/papers/Celo_Stability_Analysis.pdf')
  })

  server.get('/papers/cbdc-velocity', (_, res) => {
    res.redirect('/papers/cLabs_CBDC_Velocity_v3.pdf')
  })

  server.get('/papers/cbdc-velocity/spanish', (_, res) => {
    res.redirect('/papers/cLabs_CBDC_Velocity_Spanish.pdf')
  })

  server.get('/papers/whitepaper', (_, res) => {
    res.redirect(
      '/papers/Celo__A_Multi_Asset_Cryptographic_Protocol_for_Decentralized_Social_Payments.pdf'
    )
  })

  server.get('/papers/whitepaper/chinese', (_, res) => {
    res.redirect('/papers/celo-wp-simplified-chinese.pdf')
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

  // File serving for OpenPGP WKD https://gnupg.org/blog/20161027-hosting-a-web-key-directory.html
  // Content must be served on multiple paths, and cannot use a redirect.
  ;['/.well-known/openpgpkey/hu/:userId', '/.well-known/openpgpkey/:host/hu/:userId'].forEach(
    (route) => {
      server.get(route, (req, res) => {
        const host = req.params.host ?? req.hostname
        if (!req.hostname.includes(host)) {
          res.sendStatus(400)
          return
        }
        const userId = req.params.userId ?? ''
        if (!/\w+/.test(userId)) {
          res.sendStatus(400)
          return
        }
        res.sendFile(
          path.join(host, 'hu', userId),
          { root: path.join(process.cwd(), 'openpgpkey') },
          (err) => {
            if (err) {
              res.sendStatus(404)
            }
          }
        )
      })
    }
  )
  ;['/.well-known/openpgpkey/policy', '/.well-known/openpgpkey/:host/policy'].forEach((route) => {
    server.get(route, (req, res) => {
      const host = req.params.host ?? req.hostname
      if (!req.hostname.includes(host)) {
        res.sendStatus(400)
        return
      }
      res.sendFile(
        path.join(host, 'policy'),
        { root: path.join(process.cwd(), 'openpgpkey') },
        (err) => {
          if (err) {
            res.sendStatus(404)
          }
        }
      )
    })
  })

  server.use(bodyParser.json())

  server.post('/fellowship', rateLimit, async (req, res) => {
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
      res.status(CREATED).json({ id: fellow.id })
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setTag('Service', 'Airtable')
        Sentry.captureEvent({ message: e.message, extra: e })
      })
      respondError(res, e)
    }
  })

  server.post('/ecosystem/:table', rateLimit, async (req, res) => {
    try {
      await ecoFundSubmission(req.body, req.params.table as Tables)
      res.sendStatus(CREATED)
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setTag('Service', 'Airtable')
        Sentry.captureEvent({ message: e.message, extra: e })
      })
      respondError(res, e)
    }
  })

  server.post('/faucet', async (req, res) => {
    await faucetOrInviteController(req, res, RequestType.Faucet)
  })

  server.post('/invite', async (req, res) => {
    await faucetOrInviteController(req, res, RequestType.Invite)
  })

  server.post('/contacts', rateLimit, async (req, res) => {
    try {
      await addToCRM(req.body)
      res.status(NO_CONTENT).send('ok')
    } catch (e) {
      respondError(res, e)
    }
  })

  server.get('/announcement', async (req, res) => {
    try {
      const annoucements = await latestAnnouncements(req.ip)
      res.json(annoucements)
    } catch (e) {
      respondError(res, e)
    }
  })

  server.post('/api/alliance', rateLimit, async (req, res) => {
    try {
      await create(req.body)
      res.sendStatus(CREATED)
    } catch (e) {
      respondError(res, e)
    }
  })

  server.post('/partnerships-email', rateLimit, async (req, res) => {
    const { email } = req.body
    try {
      await mailer({
        toName: 'Team Celo',
        toEmail: 'partnerships@celo.org',
        fromEmail: 'partnerships@celo.org',
        subject: `New Partnership Email: ${email}`,
        text: email,
      })

      res.status(NO_CONTENT).send('ok')
    } catch (e) {
      respondError(res, e)
    }
  })

  server.get('/proxy/events/', async (_, res) => {
    try {
      const events = await getFormattedEvents()
      res.json(events)
    } catch (e) {
      respondError(res, e)
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
