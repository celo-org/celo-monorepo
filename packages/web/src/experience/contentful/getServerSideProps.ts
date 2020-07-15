import { GetServerSideProps } from 'next'
import { getKit, getPage } from 'src/utils/contentful'
import { Props } from 'src/experience/contentful/Dynamic'

const getServerSideProps: GetServerSideProps<
  Props,
  { kit: string; kitPage: string }
> = async function getServerSideProp({ params }) {
  console.log('pageslug', params.kitPage)
  const [kit, page] = await Promise.all([getKit(params.kit), getPage(params.kitPage)])

  console.log('PAGE', page)

  return {
    props: { ...kit, ...page },
  }
}

export default getServerSideProps
