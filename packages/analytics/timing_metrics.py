from __future__ import absolute_import

import argparse
import logging
import re
from past.builtins import unicode

import apache_beam as beam
from apache_beam.io.gcp.pubsub import ReadFromPubSub
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from celo_analytics.transforms import WriteToStackdriverLogging, ParsePubSubJson, TimeBetween
import datetime

def run(argv=None):
  parser = argparse.ArgumentParser()
  parser.add_argument('--input',
                      dest='input',
                      help='Input topic to process.')
  parser.add_argument('--output',
                      dest='output',
                      help='Output log name to write results to.')
  known_args, pipeline_args = parser.parse_known_args(argv)
  pipeline_options = PipelineOptions(pipeline_args)
  pipeline_options.view_as(SetupOptions).save_main_session = True

  isScreen = lambda event, name: event['jsonPayload']['name'] == name
  isEvent = lambda event, eventName: event['jsonPayload']['event'] == eventName

  syncStart = lambda event: isScreen(event, 'Sync')
  syncFinish = lambda event: event['jsonPayload']['type'] == 'screen' and type(event['jsonPayload']['properties']) == dict and event['jsonPayload']['properties']['previousScreen'] == 'Sync' and event['jsonPayload']['properties']['currentScreen'] != 'Sync'

  loadStart = lambda event: isEvent(event, 'APP_LOADED')
  loadFinish = lambda event: isEvent(event, 'COMPONENT_MOUNT')

  transactionStart = lambda event: isScreen(event, 'Send')
  transactionFinish = lambda event: isEvent(event, 'send_invite') or isEvent(event, 'send_dollar_confirm')

  with beam.Pipeline(options=pipeline_options) as p:

        events = (p
            | ReadFromPubSub(known_args.input, with_attributes=True)
            | ParsePubSubJson()
        )

        time_to_sync_measurements = events | TimeBetween('time_to_sync', 2 * 60, syncStart, syncFinish)
        time_to_load = events | TimeBetween('time_to_load', 60, loadStart, loadFinish)
        time_to_send_transaction = events | TimeBetween('time_to_send_transaction', 5 * 60, transactionStart, transactionFinish)

        (
          (time_to_sync_measurements, time_to_load, time_to_send_transaction)
              | beam.Flatten()
              | WriteToStackdriverLogging(known_args.output)
        )
if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run()
