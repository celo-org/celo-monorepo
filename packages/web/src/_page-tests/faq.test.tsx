import { BLOCKS } from '@contentful/rich-text-types'
import FAQ from 'pages/faq'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

const TEST_ANSWERS = [
  {
    question: 'What is Consciousness?',
    id: '42808',
    answer: {
      nodeType: BLOCKS.DOCUMENT as BLOCKS.DOCUMENT,
      contentType: BLOCKS.PARAGRAPH,
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH as BLOCKS.PARAGRAPH,
          content: [
            {
              nodeType: 'text' as 'text',
              value: 'What is now?',
              marks: [],
              data: {},
            },
          ],
          data: {},
        },
      ],
      data: {},
    },
  },
]

describe('FAQ', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <FAQ title={'A TEST FAQ'} list={TEST_ANSWERS} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
