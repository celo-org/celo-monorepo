import { GetServerSideProps } from 'next'
import { getKit, getPage } from 'src/utils/contentful'
import { Props } from 'src/experience/contentful/Dynamic'

const getServerSideProps: GetServerSideProps<
  Props,
  { kit: string; kitPage: string }
> = async function getServerSideProp({ params, req }) {
  const [kit, page] = await Promise.all([getKit(params.kit), getPage(params.kitPage)])

  const sidebar = kit.sidebar.map((entry) => {
    if (entry.href === req.url) {
      return {
        ...entry,
        sections: page.sections.map((section) => ({
          title: section.name,
          href: `${req.url}#${section.slug}`,
        })),
      }
    }
    return entry
  })

  return {
    props: {
      ...kit,
      ...page,
      sidebar,
      path: `${params.kit}${params.kitPage ? '/' + params.kitPage : ''}`,
    },
  }
}

export default getServerSideProps
