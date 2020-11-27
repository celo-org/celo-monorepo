import { GetServerSideProps } from 'next'
import { Props } from 'src/experience/contentful/ContentfulKit'
import { getKit, getPageById } from 'src/utils/contentful'

const getServerSideProps: GetServerSideProps<
  Props,
  { kit: string; kitPage: string }
> = async function getServerSideProp({ params, req, query }) {
  const locale = query.locale || 'en-US'
  const kit = await getKit(params.kit, params.kitPage, { locale })
  const page = await getPageById(kit.pageID, { locale })

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
      ogImage: kit.ogImage.fields.file.url,
      sidebar,
      path: `${params.kit}${params.kitPage ? '/' + params.kitPage : ''}`,
    },
  }
}

export default getServerSideProps
