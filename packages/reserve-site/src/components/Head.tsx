import { css, Global } from '@emotion/core'
import NextHead from 'next/head'
import colors from 'src/components/colors'
import description from 'src/content/meta-description.md'

const garamond = 'EB Garamond, eb-garamond, Garamond, serif'

const globalStyles = css`x
  * {
    box-sizing: border-box; 
    font-family: '${garamond}';
  }
  
  h1, h2, h3, h4, p, a {
    margin-top: 0;
    color: ${colors.dark};
    font-family: '${garamond}';
    font-display: 'swap';
  }

  h1 {
    line-height: 36px;
    font-size: 32px;
  }

  h2 {
    font-weight: bold;
    font-size: 20px;
    line-height: 26px;
  }

  h3 {
    margin-top: 40px;
    margin-bottom: 10px;
    font-weight: normal;
    font-size: 28px;
    line-height: 32px;
    &:first-child {
      margin-top: 0;
      color: 'red';
    }
  }

  h4 {
    font-weight: normal;
    font-size: 28px;
    line-height: 36px;
  }

  h5 {
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    line-height: 18px;
  }

  p {
    margin-bottom: 5px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    line-height: 26px;
  }

  small {
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 18px;
  }

  #__next {
    width: 100%;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: '${garamond}';
    font-display: 'swap';
    display: flex;
    justify-content: 'center';
  }

  img {
    object-fit: contain;
    width: 100%;
  }
`

export default function Head() {
  const title = 'CeloReserve.org'
  const metaImage = '/assets/open-graph.png'
  return (
    <>
      <Global styles={globalStyles} />
      <NextHead>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css?family=EB+Garamond:400,500,500i,700&display=swap"
          rel="stylesheet"
        />
        <meta name="description" content={description} />

        <meta property="og:url" content={`https://celoreserve.org`} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={metaImage} />
        <meta property="og:description" content={description} />

        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={metaImage} />
        <meta name="twitter:site" content={'@celoOrg'} />
        <meta name="twitter:card" content="summary_large_image" />
      </NextHead>
    </>
  )
}
