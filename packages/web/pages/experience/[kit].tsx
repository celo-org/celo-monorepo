import Dynamic from 'src/experience/contentful/Dynamic'
import { GetServerSideProps } from 'next'
import getContent from 'src/utils/contentful'

export default Dynamic

export const getServerSideProps: GetServerSideProps = async function getServerSideProp({
  params,
  preview,
}) {
  console.warn('params', params, 'preview', preview)
  const tent = await getContent()

  return {
    props: tent,
  }
}
