import { BLOCKS, Document, INLINES } from '@contentful/rich-text-types'
import UserAgreement from 'pages/user-agreement'

import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

const SECTIONS: Array<{
  name: string
  contentField: Document
}> = [
  {
    name: 'Article 1',
    contentField: {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          content: [
            { nodeType: 'text', value: 'Introduction', marks: [{ type: 'bold' }], data: {} },
          ],
          data: {},
        },
        {
          nodeType: BLOCKS.PARAGRAPH,
          content: [
            { nodeType: 'text', value: 'The Terms & Conditions (“', marks: [], data: {} },
            { nodeType: 'text', value: 'Terms', marks: [{ type: 'bold' }], data: {} },
            {
              nodeType: 'text',
              value:
                '” ) set forth here shall govern your use of this Website, including all pages within it (“',
              marks: [],
              data: {},
            },
            { nodeType: 'text', value: 'Site', marks: [{ type: 'bold' }], data: {} },
            {
              nodeType: 'text',
              value:
                '”). These Terms apply in full force and effect to your use of this Site and by using this Site, you expressly accept all terms and conditions contained herein in full including the ',
              marks: [],
              data: {},
            },
            {
              nodeType: INLINES.HYPERLINK,
              content: [
                {
                  nodeType: 'text',
                  value: 'Celo Community Code of Conduct',
                  marks: [{ type: 'bold' }],
                  data: {},
                },
              ],
              data: { uri: 'https://celo.org/code-of-conduct' },
            },
            {
              nodeType: 'text',
              value:
                ' (the “Community Code”). You must not use this Site, if you have any objection to any of these Terms or the Community Code. This Site is not for use by any minors (defined as those who are not at least 18 years of age), and you must not use this Site if you are a minor.',
              marks: [],
              data: {},
            },
          ],
          data: {},
        },
      ],
    },
  },
]

describe('UserAgreement', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <UserAgreement
            title="Celo Test Terms"
            description="Testing Conditions"
            updatedAt="2020-05-01"
            slug="/terms"
            sections={SECTIONS}
          />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
