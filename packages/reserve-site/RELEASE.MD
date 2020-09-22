# Release Process for CeloReserve.org

## Versioning

n/a

## Identifying releases

n/a

## Build & Promotion process

The website is hosted on [Google App Engine](https://cloud.google.com/appengine/). In order to deploy it, you first need the [gcloud SDK](https://cloud.google.com/sdk/gcloud/).

`brew cask install google-cloud-sdk`

You may need to log in and be granted additional permissions.

`gcloud auth login`

 Make sure your dependencies are up to date. root of monorepo, run:

`yarn`

> Deploying will upload files on local machine to gcloud, make sure you are on the intended branch and it is up to date

Now from web package directory deploy to stage with

`yarn deploy:stage`

do a sanity check and the deploy to prodution with

`yarn deploy:prod`


## Testing

After Deployment please manually double check the website functions right


## Vulnerability Disclosure

n/a

## Dependencies


## Dependents
