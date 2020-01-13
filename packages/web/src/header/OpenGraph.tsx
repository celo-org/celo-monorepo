import getConfig from 'next/config'
import Head from 'next/head'
import * as React from 'react'
interface Props {
  description: string
  image?: string
  title: string
  path: string
}

export default function OpenGraph({ description, image, title, path }: Props) {
  const { publicRuntimeConfig } = getConfig()
  const BASE_URL = publicRuntimeConfig.BASE_URL
  const metaImage = BASE_URL + image
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:url" content={`${BASE_URL}${path}`} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={metaImage} />
      <meta property="og:description" content={description} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content={'@celoHQ'} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  )
}
