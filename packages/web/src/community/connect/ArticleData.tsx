import fetch from 'cross-fetch'
import ArticleProps from 'fullstack/ArticleProps'
import * as React from 'react'
import ArticlesSection from 'src/community/connect/ArticlesSection'
import { getSentry } from 'src/utils/sentry'

const BASE_PATH = '/api/blog'

async function getArticles(tagged?: string) {
  const path = tagged ? `${BASE_PATH}?tagged=${tagged}` : BASE_PATH

  const res = await fetch(path, { method: 'GET' })
  return res.json()
}

interface Props {
  title: string
  tagged?: string
}

interface State {
  loaded: boolean
  errored: boolean
  articles: ArticleProps[]
}

export default class ArticleData extends React.PureComponent<Props, State> {
  state = { articles: [], loaded: false, errored: false }

  componentDidMount = async () => {
    try {
      const { articles } = await getArticles(this.props.tagged)
      this.setState({ articles, loaded: true })
    } catch (e) {
      this.setState({ errored: true })
      const Sentry = await getSentry()
      Sentry.captureMessage(`ArticleData / ${e.message}`, 'error')
    }
  }

  render() {
    const { articles, loaded, errored } = this.state
    if (errored) {
      return null
    }
    return <ArticlesSection title={this.props.title} articles={articles} loading={!loaded} />
  }
}
