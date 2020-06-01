import * as React from 'react'
import Page, { ROOT } from 'src/experience/eventkit/Page'
import Section from 'src/experience/eventkit/Section'
import { NameSpaces, useTranslation } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'

const sections = [
  hashNav.eventsResources.overview,
  hashNav.eventsResources.quickTips,
  hashNav.eventsResources.planning,
  hashNav.eventsResources.social,
].map((id) => {
  return {
    id,
    children: <Section content={require(`src/experience/eventkit/content/resources/${id}.md`)} />,
  }
})

export default function Resources() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <>
      <Page
        title="Home"
        path={ROOT}
        metaDescription={t('flavor.introduction')}
        sections={sections}
      />
    </>
  )
}
