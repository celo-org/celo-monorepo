import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as expressEnforcesSsl from 'express-enforces-ssl'
import * as helmet from 'helmet'
import * as next from 'next'
import nextI18NextMiddleware from 'next-i18next/middleware'
import addToCRM from '../server/addToCRM'
import nextI18next from '../src/i18n'
import captchaVerify from './captchaVerify'
import { submitFellowApp } from './FellowshipApp'
import { RequestStatus, startFundRequest, startInviteRequest } from './FirebaseClient'
import mailer from './mailer'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NEXT_DEV === 'true'
const app = next({ dev })
const handle = app.getRequestHandler()

// Strip the leading "www." prefix from the domain
function wwwRedirect(req, res, nextAction) {
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

  if (!dev) {
    server.use(expressEnforcesSsl())
  }

  // page redirects
  ;['/careers', '/join'].forEach((path) => {
    server.get(path, (_, res) => {
      res.redirect('/jobs')
    })
  })
  server.get('/connect', (_, res) => {
    res.redirect('/community')
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

  server.get('/tos', (_, res) => {
    res.redirect('/user-agreement')
  })

  server.use(bodyParser.json())
  server.use(nextI18NextMiddleware(nextI18next))

  server.post('/fellowship', (req, res) => {
    const { ideas, email, name, bio, deliverables, resume } = req.body

    submitFellowApp({
      name,
      email,
      ideas,
      bio,
      deliverables,
      resume,
    })

    res.status(204).send('ok')
  })

  server.post('/faucet', async (req, res) => {
    const { captchaToken, beneficiary } = req.body
    const captchaResponse = await captchaVerify(captchaToken)
    if (captchaResponse.success) {
      const funding = await startFundRequest(beneficiary)
      res.status(200).json(funding)
    } else {
      res.status(401).json({ status: RequestStatus.Failed })
    }
  })

  server.post('/invite', async (req, res) => {
    const { captchaToken, beneficiary } = req.body
    const captchaResponse = await captchaVerify(captchaToken)
    if (captchaResponse.success) {
      const funding = await startInviteRequest(beneficiary)
      res.status(200).json(funding)
    } else {
      res.status(401).json({ status: RequestStatus.Failed })
    }
  })

  server.post('/contacts', async (req, res) => {
    addToCRM(req.body)
    res.status(204).send('ok')
  })

  server.post('/partnerships-email', async (req, res) => {
    const { email } = req.body
    mailer({
      toName: 'Team Celo',
      toEmail: 'partnerships@celo.org',
      fromEmail: 'partnerships@celo.org',
      subject: `New Partnership Email: ${email}`,
      text: email,
    })
    res.status(204).send('ok')
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  await server.listen(port)

  // tslint:disable-next-line
  console.log(`> Ready on http://localhost:${port}`)
})()
