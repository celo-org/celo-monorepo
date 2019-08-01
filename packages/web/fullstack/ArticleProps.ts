export default interface ArticleProps {
  imgSource: string
  href: string
  title: string
  text: string
  onLoad?: () => void
}

export interface Articles {
  articles: ArticleProps[]
}
