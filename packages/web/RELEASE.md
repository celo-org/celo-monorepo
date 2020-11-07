# Celo.org Releases

## Versioning

n/a

## Identifying releases

Identify by commit hash

## Build & Promotion process

The website is hosted on [Google App Engine](https://cloud.google.com/appengine/). In order to deploy it, you first need the [gcloud SDK](https://cloud.google.com/sdk/gcloud/).

`brew cask install google-cloud-sdk`

You may need to log in and be granted additional permissions.

`gcloud auth login`

 Make sure your dependencies are up to date. From the root of monorepo, run

`yarn`

> Deploying will upload files on local machine to gcloud, make sure you are on the intended branch and it is up to date

Now from web package directory deploy to dev.celo.org with: 

`yarn run deploy:dev`

to deploy to the `dev` environment, with similar commands for `stage` and `prod`

#### dev vs stage

While not enforced, the norms for using the different non-production environments are like so: 

Use Stage for checking a commit works as expected before deploying to production 

Use Dev for sending previews to stakeholders while developing new features. 


## Testing

After Release please manually check the website doesnt have have any unexpected weirdness. 

## Vulnerability Disclosure


## Dependencies

@celo/utils

## Dependents

n/a