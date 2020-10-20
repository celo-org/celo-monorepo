import { Entry } from 'contentful'
import { ContentFulItem, Props } from './DirectoryItem'

export function contentfulToProps({ fields }: Entry<ContentFulItem>): Props {
  const file = fields?.logo?.fields?.file
  const image = file?.details?.image
  return {
    ...fields,
    logo: file?.url,
    logoHeight: image?.height || 0,
    logoWidth: image?.width || 0,
  }
}
