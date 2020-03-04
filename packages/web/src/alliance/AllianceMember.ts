export default interface AllianceMember {
  name: string
  logo: { uri: string; ratio: number }
  url: string
}

export interface Grouping {
  name: string
  records: AllianceMember[]
}
