import getConfig from 'next/config'
const Mailgun = require('mailgun-js')

interface Mailer {
  toEmail: string
  toName: string
  subject: string
  text: string
  fromEmail?: string
}

export default async function send({ toEmail, text, fromEmail, subject, toName }: Mailer) {
  const { serverRuntimeConfig } = getConfig()
  const mailgun = Mailgun({
    apiKey: serverRuntimeConfig.MAILGUN_API_KEY,
    domain: serverRuntimeConfig.MAILGUN_DOMAIN,
    retry: 2,
  })

  const data = {
    from: formatAddress('Celo', fromEmail || 'noreply@celo.org'),
    to: formatAddress(toName, toEmail),
    subject,
    text,
  }

  await mailgun.messages().send(data)
}

const formatAddress = (name: string, email: string) => `${name ? name : ''} <${email}>`.trim()
