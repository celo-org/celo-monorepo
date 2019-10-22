from __future__ import absolute_import

import argparse
import logging
import re
import json
import urllib2
import sys
import textwrap

import apache_beam as beam
from apache_beam.io.gcp.pubsub import ReadFromPubSub
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions

import google.cloud.logging as stackdriver_logging


class ReadGCSNotifications(beam.PTransform):

  def __init__(self, env, bucket_name, log_name, pipeline_args):
    self.bucket_name = bucket_name
    self.env = env
    self.gcs = None
    self.pipeline_args = pipeline_args
    self.log_name = log_name


  def parse_element(self, element):
    message = json.loads(element.data)
    bucket = message['bucket']
    # Only import from the bucket we are expecting.
    if bucket != self.bucket_name:
      return []
    filepath = message['name']
    logging.info('Got file: %s, %s', bucket, filepath)
    logging.info('Got -: %s', message)
    logline_metadata = None
#    try:
    # Split path component. Expecting logs/date/bundleId/env/
    path_comps = filepath.split('/')
    if len(path_comps) < 3 or (path_comps[3] != self.env and self.env is not None):
      logging.info('Skipping %s', filepath)
      return [] 
    name = path_comps[len(path_comps)-1]
    if name.endswith('.txt'):
      name = name[0:len(name)-4]
    name_comps = name.split('_')
    self.env = path_comps[3]
    self.log_name = 'client-logs-%s'%(self.env) if self.log_name is None else self.log_name
    logline_metadata = {
      'suffix' : name_comps[2], 
      'bundleId': path_comps[2],
      'env': path_comps[3],
      'phone': urllib2.unquote(name_comps[0]).decode('utf8'),
      'filepath': filepath
    }
    self.logline_metadata = logline_metadata
    logging.info('Got file: %s with %s', filepath, logline_metadata)

    if not self.gcs:
      # These imports have to be nested (ugh) because the constructor and the 
      # main pipeline get evaluated locally when deploying remotely from 
      # the cmdline, and this class is only available when running on GCS
      from apache_beam.io.gcp.gcsfilesystem import GCSFileSystem
      self.gcs = GCSFileSystem(PipelineOptions(self.pipeline_args))
      self.logger = stackdriver_logging.Client().logger(self.log_name)

    # Read the whole file (ugh) from GCS. Without SDoFns support in Python, that's the best
    # we can do in dataflow right now.

    with self.gcs.open('gs://%s/%s' % (bucket, filepath), mime_type='text/plain') as infile:
      for line in infile:
        if sys.getsizeof(line) > 1000:
          lines = textwrap.wrap(line, 1000, break_long_words=False)
          for text in lines:
            self.writeLog(text)
        else:
          self.writeLog(line)
    return []

  def writeLog(self, text):
    severity_pattern = re.compile('^([A-Za-z]+)')
    severity_remappings = {
      'TRACE' : 'DEBUG',
      'LOG'   : 'DEBUG',
      'WARN'  : 'WARNING',
      'CRIT'  : 'CRITICAL'
    }
    # Build log element from message, and labels from metadata
    log_element = dict(self.logline_metadata)
    log_element['msg'] = text

    # Try to parse out the severity from the start of the line
    # And try and make sure it maps to a valid SD severity
    match = severity_pattern.match(text)
    if match:     
      log_severity = match.group(1).upper()
      log_severity = severity_remappings.get(log_severity, log_severity)
      try:
        # Write the struct to SD using the hopefully valid severity
        self.logger.log_struct(log_element, severity=log_severity) 
      except:
        # Write the struct to SD without a severity 
        self.logger.log_struct(log_element) 
    else:
      # Write the struct to SD without a severity 
      self.logger.log_struct(log_element) 
    


  def expand(self, pcoll):
    return pcoll | 'ReadGCSNotifications' >> beam.FlatMap(self.parse_element)



def run(argv=None):
  parser = argparse.ArgumentParser()
  parser.add_argument('--env',
                      dest='env',
                      help='Environment to filter on (corresponding to testnet name)')
  parser.add_argument('--input',
                      dest='input',
                      help='Input topic to process.')
  parser.add_argument('--bucket',
                      dest='bucket',
                      help='GCS bucket name for logs')
  parser.add_argument('--output',
                      dest='output',
                      help='Output log name to write results to.')
  known_args, pipeline_args = parser.parse_known_args(argv)
  pipeline_options = PipelineOptions(pipeline_args)
  pipeline_options.view_as(SetupOptions).save_main_session = True

  with beam.Pipeline(options=pipeline_options) as p:
    (p
      | ReadFromPubSub(known_args.input, with_attributes=True)
      | ReadGCSNotifications(known_args.env, known_args.bucket, known_args.output, pipeline_args)
    )

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run()
