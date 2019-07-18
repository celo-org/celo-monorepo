from __future__ import absolute_import

import argparse
import logging
import re
import json

import apache_beam as beam
from apache_beam import window
from apache_beam.io.gcp.pubsub import ReadFromPubSub
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from celo_analytics.transforms import WriteToStackdriverLogging, ParsePubSubJson

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
  with beam.Pipeline(options=pipeline_options) as p:

        (p
            | ReadFromPubSub(known_args.input, with_attributes=True)
            | ParsePubSubJson()
            | WriteToStackdriverLogging(known_args.output)
        )

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run()
