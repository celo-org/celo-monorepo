import { GetServerSideProps } from 'next'
import Dynamic from 'src/experience/contentful/Dynamic'
import { getKit } from 'src/utils/contentful'

export default Dynamic

export const getServerSideProps: GetServerSideProps<
  object,
  { kit: string; kitPage: string }
> = async function getServerSideProp({ params }) {
  const kit = await getKit(params.kit)
  return {
    props: kit,
  }
}
