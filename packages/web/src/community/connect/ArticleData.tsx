import fetch from 'cross-fetch'
import * as React from 'react'
import ArticlesSection from 'src/community/connect/ArticlesSection'

const BASE_PATH = '/api/blog'

async function getArticles(tagged?: string) {
  const path = tagged ? `${BASE_PATH}?tagged=${tagged}` : BASE_PATH

  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
  return res.json()
}

interface Props {
  title: string
  tagged?: string
}

export default class ArticleData extends React.PureComponent<Props> {
  state = { articles: [], loaded: false }

  componentDidMount = async () => {
    const { articles } = await getArticles(this.props.tagged)
    this.setState({ articles, loaded: true })
  }

  render() {
    const { articles, loaded } = this.state
    return <ArticlesSection title={this.props.title} articles={articles} loading={!loaded} />
  }
}
