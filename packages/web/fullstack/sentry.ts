import getConfig from 'next/config'

export default function sentryConfig() {
  const { publicRuntimeConfig } = getConfig()
  const config = publicRuntimeConfig.SENTRY
  return {
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: publicRuntimeConfig.ENV,
    ignoreErrors: [
      "The fetching process for the media resource was aborted by the user agent at the user's request.",
    ],
  }
}
