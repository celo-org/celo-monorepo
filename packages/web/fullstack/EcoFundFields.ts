// values from airtable colum names https://airtable.com/appkDZ6GFpgCxJPA9/api/docs#javascript/table:application:fields
export enum EcuFundFields {
  name = 'Full Name',
  email = 'Email',
  ideas = 'What do you want to create?',
  deliverables = 'What are your expected deliverables?',
  bio = 'Tell us about yourself',
  resume = 'Resume',
}

export interface EcoFundKeys {
  name: string
}
