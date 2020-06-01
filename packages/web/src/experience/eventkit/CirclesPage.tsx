import * as React from 'react'
import Page, { CIRCLES_PATH } from 'src/experience/eventkit/Page'
import { NameSpaces, useTranslation } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'

import Section from 'src/experience/eventkit/Section'

const sections = [hashNav.eventCircles.overview, hashNav.eventCircles.sponsorship].map((id) => {
  return {
    id,
    children: <Section content={require(`src/experience/eventkit/content/circles/${id}.md`)} />,
  }
})
export default function Flavor() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <>
      <Page
        title="Home"
        path={CIRCLES_PATH}
        metaDescription={t('flavor.introduction')}
        sections={sections}
      />
    </>
  )
}

export function getServerSideProps(context) {
  console.log('FOR REAL', context.req.path)
}
