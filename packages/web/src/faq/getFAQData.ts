import { GetServerSideProps } from 'next'
import { Props } from 'src/faq/FAQ'
import { getFAQ } from 'src/utils/contentful'

const getServerSideProps: GetServerSideProps<Props> = async function getServerSideProp({ query }) {
  const locale = query.locale || 'en-US'
  const faqs = await getFAQ({ locale })
  return {
    props: {
      title: faqs.fields.title,
      list: faqs.fields.list.map((item) => {
        return {
          question: item.fields.question,
          answer: item.fields.answer,
          id: item.sys.id,
        }
      }),
      id: faqs.sys.id,
      updatedAt: faqs.sys.updatedAt,
    },
  }
}

export default getServerSideProps
