import * as React from 'react'
import Page, { ROOT, ROUTE_TO_TITLE } from 'src/experience/eventkit/Page'
import Section from 'src/experience/eventkit/Section'
import { hashNav } from 'src/shared/menu-items'

const sections = [hashNav.eventsIntro.overview].map((id) => {
  return {
    id,
    children: <Section content={require(`src/experience/eventkit/content/intro/${id}.md`)} />,
  }
})
export default function Flavor() {
  return <Page title={ROUTE_TO_TITLE[ROOT]} path={ROOT} sections={sections} />
}
