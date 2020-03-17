# Metadata Crawler

This package connects to Blockscout database, get all the metadata urls, 
verify the metadata claims and update the database if the user claims
could be verified succesfully.

For this package to work properly, the software must have SELECT and UPDATE 
access to the Blockscout database.

The env variable `CRAWLER_DATABASE` must be set. When testing locally, you can 
set `CRAWLER_DATABASE="postgres://postgres:password@127.0.0.1:5432/blockscout?ssl=false"`

You can start the crawler running `yarn dev`
