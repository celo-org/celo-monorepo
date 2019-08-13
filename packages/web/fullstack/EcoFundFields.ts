// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/authentication
export enum ApplicationFields {
  org = 'Organization Name',
  url = 'Organization URL',
  about = 'Tell us about your organization in a sentence.',
  product = 'What does your organization make?',
  founderEmail = 'Email of the founder who is filling out this application',
  coFounderEmail = "Cofounders' email (if relevant)",
  video = 'Optional: please enter the URL of a simple 1 minute unlisted (not private) YouTube, Vimeo, or Youku video introducing the founder(s).',
}

export interface Application {
  org: string
  url: string
  about: string
  product: string
  founderEmail: string
  coFounderEmail: string | undefined
  video: string | undefined
}

// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/table:recommendations
export enum RecommendationFields {
  orgName = '',
  email = 'Your Email Address',
  founderEmail = 'One founder’s name',
  founderName = "One founder's name",
  why = 'Why do you recommend this applicant?',
}

export interface Recommendation {
  orgName: string
  email: string
  founderEmail: string
  founderName: string
  why: string
}
