import { GetServerSideProps } from 'next'
import { getKit, getPage } from 'src/utils/contentful'
import { Props } from 'src/experience/contentful/Dynamic'

const getServerSideProps: GetServerSideProps<
  Props,
  { kit: string; kitPage: string }
> = async function getServerSideProp({ params }) {
  const [kit, page] = await Promise.all([getKit(params.kit), getPage(params.kitPage)])

  return {
    props: { ...kit, ...page, path: `${params.kit}${params.kitPage ? '/' + params.kitPage : ''}` },
  }
}

export default getServerSideProps
