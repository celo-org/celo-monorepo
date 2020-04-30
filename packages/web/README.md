# Web

This is the Celo website, which is deployed to https://celo.org/

## Developing

### Steps to get running

1. ensuring you have installed the latest dependencies:

`yarn`

2. decrypted the secrets files, (this requires being authenticated on gcloud)

  * `brew cask install google-cloud-sdk` && `gcloud auth login` 

  * from root of monorepo run `yarn run keys:decrypt`  

3. from web directory run `yarn run dev`

which will start a server accessible at [http://localhost:3000](http://localhost:3000)

## Architecture

The website uses [React.js](https://reactjs.org/), [Next.js](https://nextjs.org/), and [React Native Web](https://github.com/necolas/react-native-web). React is a great library for building user interfaces. Next.js takes care of server-rendering React apps in a simple way and preloading/transitioning pages quickly. React Native web allows us to use the same code in the application on the website, specifically the way we do CSS.

### Notes on Web Package Directory

`/pages` files in here become page routes which reflect the folder structure they are in
`/pages/api` files in here become api routes see next.js docs for more information 

`server` files here are strictly for serverside code. (currently only reletive paths are working)

`public` static files can be found here. such as [Celo Whitepapers](https://github.com/celo-org/celo-monorepo/tree/master/packages/web/public/papers) (including stability paper) and i18n locale files. 

`src` most files here including, components, tests for components, images. 

## Testing

🧰 tools: `jest`, `@testing-library/react`

✅ run tests with `yarn test`

📸 update snapshots with `yarn test -u`

#### Testing Strategy

Each page should have a snapshot test found in `src/_page-tests`. More interactive components should have an additional tests for various states/ interactions. These test files should be coolocated with the file they are testing. 

## Deployment

The website is hosted on [Google App Engine](https://cloud.google.com/appengine/). In order to deploy it, you first need the [gcloud SDK](https://cloud.google.com/sdk/gcloud/).

`brew cask install google-cloud-sdk`

You may need to log in and be granted additional permissions.

`gcloud auth login`

 Make sure your dependencies are up to date. root of monorepo, run:

`yarn`

> Deploying will upload files on local machine to gcloud, make sure you are on the intended branch and it is up to date

Now from web package directory deploy to dev.celo.org with: 

`yarn run deploy:dev`

to deploy to the `dev` environment, with similar commands for `staging` and `prod`


#### dev vs staging

While not enforced, the norms for using the different non-production environments are like so: 

Use Staging for checking a commit works as expected before deploying to production 

Use Dev for sending previews to stakeholders while developing new features. 

