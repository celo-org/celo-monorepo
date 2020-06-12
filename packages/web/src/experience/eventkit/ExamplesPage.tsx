import * as React from 'react'
import Page, { EXAMPLES_PATH, ROUTE_TO_TITLE } from 'src/experience/eventkit/Page'
import Section from 'src/experience/eventkit/Section'
import { hashNav } from 'src/shared/menu-items'

const sections = [
  hashNav.eventExamples.examples,
  hashNav.eventExamples.slideDecks,
  hashNav.eventExamples.videos,
].map((id) => {
  return {
    id,
    children: <Section content={require(`src/experience/eventkit/content/examples/${id}.md`)} />,
  }
})

export default function ExamplesPage() {
  return <Page title={ROUTE_TO_TITLE[EXAMPLES_PATH]} path={EXAMPLES_PATH} sections={sections} />
}
