# Web

This is the Celo website, which is deployed to https://celo.org/

## Developing

You can run the local version by first ensuring you have installed the latest dependencies:

`yarn`

and then running

`yarn run dev`

which will start a server accessible at [http://localhost:3000](http://localhost:3000)

## Architecture

The website uses [React.js](https://reactjs.org/), [Next.js](https://nextjs.org/), and [React Native Web](https://github.com/necolas/react-native-web). React is a great library for building user interfaces. Next.js takes care of server-rendering React apps in a simple way and preloading/transitioning pages quickly. React Native web allows us to use the same code in the application on the website, specifically the way we do CSS.

## Deployment

The website is hosted on [Google App Engine](https://cloud.google.com/appengine/). In order to deploy it, you first need the [gcloud SDK](https://cloud.google.com/sdk/gcloud/).

`brew install gcloud`

You may need to log in and be granted additional permissions.

Make sure your dependencies are up to date. in this directory, run:

`yarn`

Now you can run

`yarn run deploy:dev`

to deploy to the `dev` environment, with similar commands for `staging` and `prod`

## Add your picture

Take a look at the files in [this folder](https://github.com/celo-org/celo-monorepo/tree/master/packages/web/src/about/team) and see if you can figure out how to add your picture to the `/about` page :)
