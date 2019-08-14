// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/authentication
export enum ApplicationFields {
  org = 'Organization Name',
  url = 'Organization URL',
  about = 'Tell us about your organization in a sentence.',
  product = 'What does your organization make?',
  founderEmail = 'Email of the founder who is filling out this application',
  coFounderEmail = "Cofounders' email (if relevant)",
  video = 'Optional: URL of a simple 1 minute unlisted (not private) YouTube, Vimeo, or Youku video introducing the founder(s).',
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

// https://airtable.com/apppO5poOzAE5YYJN/api/docs#javascript/table:Recommendationss
export enum RecommendationFields {
  email = 'Your Email Address',
  org = 'Organization you are Recommending',
  founderEmail = 'One founder’s name',
  founderName = "One founder's name",
  why = 'Why do you recommend this applicant?',
}

export type Recommendation = Record<keyof RecommendationFields, string>

export const RecommendationKeys = Object.keys(RecommendationFields)

export enum Tables {
  Applicants = 'Applicants',
  Recommendations = 'Recommendations',
}
