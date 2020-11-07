/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Footer from 'src/components/Footer'
import Head from 'src/components/Head'
import NavBar from 'src/components/Navbar'
import { flexCol, mainStyle, rootStyle } from 'src/components/styles'

interface Props {
  year: string
}

export default function Page(props: Props) {
  return (
    <>
      <Head />
      <div css={rootStyle}>
        <div css={containerStyle}>
          <NavBar />
          <main css={bodyStyle}>
            <img src="assets/unique.png" css={imageStyle} />
            <h1 css={titleStyle}>Page Not Found</h1>
          </main>
        </div>
        <Footer year={props.year} />
      </div>
    </>
  )
}

const bodyStyle = css(mainStyle, {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  alignContent: 'center',
})

const imageStyle = css({
  maxWidth: 400,
  padding: 24,
})

const titleStyle = css({ textAlign: 'center', marginTop: 30 })

const containerStyle = css(flexCol, { flex: 1, width: '100%', alignItems: 'center' })

export async function getStaticProps() {
  return {
    props: {
      year: new Date().getFullYear(),
    },
    revalidate: 86400, // day
  }
}
