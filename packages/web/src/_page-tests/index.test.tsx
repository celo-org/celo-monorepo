import HomePage from 'pages/index'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import i18n from 'src/utils/i18nForTests'

const Test = i18n.appWithTranslation(() => {
  return <HomePage isRestricted={true} />
})

describe('HomePage', () => {
  it('renders', async () => {
    const tree = renderer.create(<Test />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
