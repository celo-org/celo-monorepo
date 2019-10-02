# Analytics

This package houses all Cloud Dataflow/Apache Beam jobs that we might need to create.

### Running a job

You can either run a job locally with `DirectRunner` or on GCP with `DataflowRunner`.

Dataflow only works with Python 2.7.

To run locally, you will need:

```
brew install python2
pip install -r requirements.txt
```

To run on GCP, you'll need to use a service account with the appropriate credentials. Then create and download a key file as JSON, and export it, e.g:

```
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/celo-testnet-ed0960b7047d.json
```

## Segment Data Exporter

The Segment Data Exporter pulls analytics data that Segment pushes on to a pub-sub topic and writes it into StackDriver.

Run it locally:

```bash
python segment_data_exporter.py \
    --input projects/celo-testnet/topics/segment-test \
    --output [OUTPUT] \
    --streaming \
    --runner=DirectRunner \
    --project celo-testnet \
    --temp_location gs://[YOUR_DIRECTORY]/staging \
    --staging_location gs://[YOUR_DIRECTORY]/staging \
    --setup_file $CELO_ROOT/celo-monorepo/packages/analytics/setup.py
```

The currently deployed job in `celo-testnet` was deployed with:

```bash
python segment_data_exporter.py \
    --input projects/celo-testnet/topics/segment-dev-raw-events \
    --output segment-dev-raw-events \
    --streaming \
    --runner=DataflowRunner \
    --project celo-testnet \
    --temp_location gs://celo_analytics/dataflow_temp \
    --staging_location gs://celo_analytics/dataflow_staging \
    --setup_file $CELO_ROOT/celo-monorepo/packages/analytics/setup.py \
    --job_name segment-data-exporter-dev-raw-events
```

A similar job runs in the `celo-testnet-production` project.

## Client Logs Exporter

The Client Logs Exporter takes a stream of [Google Cloud Storage notifications](https://cloud.google.com/storage/docs/pubsub-notifications) published to a pub-sub topic (in `celo-testnet` project) about newly-uploaded [client logs](https://console.cloud.google.com/storage/browser/celo-org-mobile.appspot.com/logs/?project=celo-org-mobile&organizationId=54829595577) (in `celo-mobile-app` project). It processes those notifications and emits the contents of those files to StackDriver (to the log named by `--output`.)

The job expects client logs to be located at a path `logs/$DATE/$BUNDLEID/$ENV/$TIMESTAMP_$PHONE_$SUFFIX.txt`.

Each instance of the job filters on the `$ENV` path component to match the value passed by `--env`. In this way, one Dataflow job needs to be run per environment. If no value is passed all environments are matched.

The notification was created as follows:

```
gsutil notification create -f json -e OBJECT_FINALIZE -t projects/celo-testnet/topics/clientlogs gs://celo-org-mobile.appspot.com
```

You can view current notifications as follows:

```
gsutil notification list gs://celo-org-mobile.appspot.com/
```

The service account for `celo-testnet` was given permissions to read GCS buckets and objects on the `celo-mobile-app` project to allow the Dataflow job succeed.

The currently deployed job was deployed with:

```bash
python client_log_exporter.py \
    --input projects/celo-testnet/topics/clientlogs \
    --bucket celo-org-mobile.appspot.com \
    --streaming \
    --runner=DataflowRunner \
    --project celo-testnet \
    --temp_location gs://[YOUR_DIRECTORY]/dataflow_temp \
    --staging_location gs://[YOUR_DIRECTORY]/dataflow_staging \
    --setup_file $CELO_ROOT/celo-monorepo/packages/analytics/setup.py \
    --job_name client-log-exporter-run3
```
