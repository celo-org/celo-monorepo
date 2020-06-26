/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { GetStaticPaths } from 'next'
import Footer from 'src/components/Footer'
import Head from 'src/components/Head'
import NavBar from 'src/components/Navbar'
import Section from 'src/components/Section'
import { flexCol, mainStyle, rootStyle } from 'src/components/styles'
import { Updated } from 'src/components/Updated'

interface Props {
  body: string
  title: string
  updated: string
  year: string
}

export default function Page(props: Props) {
  return (
    <>
      <Head />
      <div css={rootStyle}>
        <div css={containerStyle}>
          <NavBar />
          <main css={mainStyle}>
            <Section
              title={props.title}
              subHeading={<Updated humanDate={props.updated} />}
              content={props.body}
            />
          </main>
        </div>
        <Footer year={props.year} />
      </div>
    </>
  )
}

const containerStyle = css(flexCol, { flex: 1, width: '100%', alignItems: 'center' })

export async function getStaticProps({ params }) {
  const doc = await import(`src/content/legal/${params.doc}.md`).then((mod) => mod.default)
  const matter = await import('front-matter').then((mod) => mod.default)
  const document = matter<{ title: string; updated: string }>(doc)
  return {
    props: {
      year: new Date().getFullYear(),
      body: document.body,
      title: document.attributes.title,
      updated: document.attributes.updated,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async function getStaticPaths() {
  return {
    paths: [{ params: { doc: 'privacy' } }, { params: { doc: 'terms' } }],
    fallback: false,
  }
}
