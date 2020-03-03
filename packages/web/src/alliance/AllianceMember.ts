export default interface AllianceMember {
  name: string
  logo: string
  url: string
}

export interface Grouping {
  name: string
  records: AllianceMember[]
}
