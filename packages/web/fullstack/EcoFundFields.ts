// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/authentication
export enum ApplicationFields {
  org = 'Organization Name',
  url = 'Organization URL',
  about = 'Tell us about your organization in a sentence',
  product = 'What does your organization do?',
  founderEmail = 'Founder email filling out application',
  coFounderEmail = 'Cofounder emails (if relevant)',
  video = 'Optional: URL of a simple 1 minute unlisted YouTube, Vimeo, or Youku video introducing the founder(s)',
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

export const ApplicationKeys = Object.keys(ApplicationFields)

// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/table:Referrals
export enum RecommendationFields {
  email = 'Your Email Address',
  org = 'Organization you are Recommending',
  founderEmail = 'One founder’s email',
  founderName = "One founder's name",
  why = 'Why do you recommend this applicant?',
}

export interface Recommendation {
  email: string
  org: string
  founderEmail: string
  founderName: string
  why: string
}

export const RecommendationKeys = Object.keys(RecommendationFields)

// Must match table name on Airtable
export enum Tables {
  Applicants = 'Applicants',
  Recommendations = 'Referrals',
}
