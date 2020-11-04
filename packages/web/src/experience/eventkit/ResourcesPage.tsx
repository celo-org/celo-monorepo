import * as React from 'react'
import Page, { RESOURCES_PATH, ROUTE_TO_TITLE } from 'src/experience/eventkit/Page'
import Section from 'src/experience/eventkit/Section'
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
  return <Page title={ROUTE_TO_TITLE[RESOURCES_PATH]} path={RESOURCES_PATH} sections={sections} />
}
