import json
import logging
import urllib2
from functools import partial

import apache_beam as beam
import dateutil.parser
import google.cloud.logging as stackdriver_logging
from apache_beam import window


class ParsePubSubJson(beam.PTransform):
  def parse_element(self, element):
    try:
      return [json.loads(element.data)]
    except ValueError as identifier:
      return []
  def expand(self, pcoll):
    return pcoll | 'ParseJson' >> beam.FlatMap(self.parse_element)


class WriteToStackdriverLoggingParDo(beam.DoFn):
  def __init__(self, log_name):
    super(beam.DoFn, self)
    self.log_name = log_name
  def start_bundle(self):
    logging_client = stackdriver_logging.Client()
    self.logger = logging_client.logger(self.log_name)
  def process(self, element, *args, **kwargs):
    if 'timestamp' in element:
      try:
        self.logger.log_struct(element, timestamp=dateutil.parser.parse(element['timestamp']))
      except ValueError as error:
        self.logger.log_struct(element)
    else:
      self.logger.log_struct(element)


class WriteToStackdriverLogging(beam.PTransform):
  def __init__(self, log_name, stage_name="WriteToStackdriverLogging"):
    super(beam.PTransform, self)
    self.stage_name = stage_name
    self.log_name = log_name
  def expand(self, pcoll):
    return pcoll | self.stage_name >> beam.ParDo(WriteToStackdriverLoggingParDo(self.log_name))

def keysafeFilter(filter, element):
  try:
    return filter(element)
  except KeyError:
    return False

def tupleByIdAndEnvironment(event):
  return ((event['jsonPayload']['anonymousId'], event['jsonPayload']['properties']['defaultTestnet']), event)

class TimeBetween(beam.PTransform):
  def __init__(self, metric_name, session_window, start_event_filter, finish_event_filter):
    super(beam.PTransform, self)
    self.label = metric_name
    self.metric_name = metric_name
    self.session_window = session_window
    self.start_event_filter = partial(keysafeFilter, start_event_filter)
    self.finish_event_filter = partial(keysafeFilter, finish_event_filter)

  def filter_event(self, event):
    return self.start_event_filter(event) or self.finish_event_filter(event)

  def parseTimestamp(self, event):
    return dateutil.parser.parse(event['timestamp'])

  def calculate_time(self, data):
    (anonymousId, environment), events = data
    events.sort(key=lambda event: event['timestamp'])
    try:
      startEvent = next(event for event in events if self.start_event_filter(event))
    except StopIteration as identifier:
      return []
    try:
      finishEvent = next(event for event in events if self.finish_event_filter(event))
      time = self.parseTimestamp(finishEvent) - self.parseTimestamp(startEvent)
      if (time.total_seconds() < 0):
        raise Exception('time period is somehow negative, metric: {}, id: {}'.format(self.metric_name, anonymousId))
      return [{
          'event': 'DATAFLOW_METRIC_MEASUREMENT',
          'metric': self.metric_name,
          'environment': environment,
          'anonymousId': anonymousId,
          'startTime': startEvent['timestamp'],
          'window': self.session_window,
          'value': time.total_seconds()
      }]
    except StopIteration as identifier:
      return [{
          'event': 'DATAFLOW_METRIC_MEASUREMENT_TIMEOUT',
          'metric': self.metric_name,
          'environment': environment,
          'anonymousId': anonymousId,
          'startTime': startEvent['timestamp'],
          'window': self.session_window,
          'value': self.session_window # With no finish event, we set the value of the measurement to the session window as the maximally acceptable value
      }]

  def expand(self, pcoll):
    return (
      pcoll
        | 'Filter Relevant Events' >> beam.Filter(self.filter_event)
        | 'Key by ID and Environment' >> beam.Map(tupleByIdAndEnvironment)
        | 'Window {}'.format(self.session_window) >> beam.WindowInto(window.Sessions(self.session_window))
        | beam.GroupByKey()
        | 'Calculate Time Between' >> beam.FlatMap(self.calculate_time)
    )
