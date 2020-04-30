import getConfig from 'next/config'

export default function sentryConfig() {
  const { publicRuntimeConfig } = getConfig()
  const config = publicRuntimeConfig.SENTRY
  return {
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: publicRuntimeConfig.ENV,
    ignoreErrors: [
      /a\[b\]\.target\.className\.indexOf/, // google translate issue https://medium.com/@amir.harel/a-b-target-classname-indexof-is-not-a-function-at-least-not-mine-8e52f7be64ca
      "The fetching process for the media resource was aborted by the user agent at the user's request.",
      /chrome-extension/,
      /moz-extension/,
    ],
  }
}
