from google.cloud import bigquery
from enum import Enum
import pandas as pd


def get_client(project):
    return bigquery.Client(project)


class EventTypes(Enum):
    RECEIVED_BLOCK = "RECEIVED_BLOCK"
    RECEIVED_STATE = "RECEIVED_STATE"
    RECEIVED_TRANSACTION = "RECEIVED_TRANSACTION"
    RECEIVED_TRANSACTION_RECEIPT = "RECEIVED_TRANSACTION_RECEIPT"
    RECEIVED_PARSED_TRANSACTION = "RECEIVED_PARSED_TRANSACTION"
    RECEIVED_PARSED_LOG = "RECEIVED_PARSED_LOG"


def query_blocks(client, table, window_min, window_max):
    query = f"""
    SELECT 
      MAX(T.jsonPayload.timestamp) as timestamp,
      T.jsonPayload.number as blockNumber,
      MAX(T.jsonPayload.gasUsed) as gasUsed,
      MAX(T.jsonPayload.gasLimit) as gasLimit,
      COUNT(T.jsonPayload.transactions) as txAmount
    FROM 
      `{table}` as T
    WHERE
       T.jsonPayload.event='{EventTypes.RECEIVED_BLOCK.value}' and
       T.jsonPayload.number >= {window_min} and
       T.jsonPayload.number <= {window_max}
    GROUP BY blockNumber
    ORDER BY blockNumber DESC 
    """

    df_blocks = client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[]
        )
    ).to_dataframe()

    df_blocks['blocktime'] = df_blocks[::-1].diff(axis=0).timestamp
    return df_blocks


def query_state(client, table, window_min, window_max, df_blocks):
    query = f"""
    SELECT
      timestamp,
      jsonPayload.blockNumber,
      jsonPayload.values.rewardsamount,
      jsonPayload.values.rewardsmultiplier,
      jsonPayload.values.medianRate,
      jsonPayload.values.currentStableBucket,
      jsonPayload.values.currentGoldBucket,
      jsonPayload.values.goldTokenTotalSupply
    FROM 
      `{table}` as T
    WHERE 
      jsonPayload.event='{EventTypes.RECEIVED_STATE.value}' and
      jsonPayload.blockNumber >= {window_min} and
      jsonPayload.blockNumber <= {window_max}
    ORDER BY 
      T.jsonPayload.blockNumber DESC,
      T.timestamp DESC
    """

    df_state = client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[]
        )
    ).to_dataframe()

    df_state = df_state \
        .groupby('blockNumber').max() \
        .merge(df_blocks, left_on='blockNumber', right_on='blockNumber',
               suffixes=('_tme', '_block'))
    df_state['datetime_block'] = pd.to_datetime(df_state['timestamp_block'],
                                                unit='s')
    df_state[['currentStableBucket', 'currentGoldBucket']] = df_state[
        ['currentStableBucket', 'currentGoldBucket']].astype('float')
    return df_state


def query_events(client, table, window_min, window_max, df_state):
    query = f"""
    SELECT
      jsonPayload.blockNumber as blockNumber,
      jsonPayload.returnValues,
      jsonPayload.address,
      jsonPayload.eventName
    FROM 
      `{table}` as T
    WHERE 
      jsonPayload.event='{EventTypes.RECEIVED_PARSED_LOG.value}' and
      jsonPayload.blockNumber >= {window_min} and
      jsonPayload.blockNumber <= {window_max}
    ORDER BY 
      blockNumber DESC
    """

    df_events = client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[]
        )
    ).to_dataframe()

    df_events = pd.concat([
        df_events.drop(['returnValues'], axis=1),
        df_events['returnValues'].apply(pd.Series)
    ], axis=1)

    df_events[['buyamount', 'sellamount']] = df_events[
        ['buyamount', 'sellamount']].astype('float')
    df_events = df_events.merge(df_state, left_on='blockNumber',
                                right_on='blockNumber')
    return df_events


def query_receipt(client, table_path, window_min, window_max):
    query = f"""
    WITH logQuery AS (
      SELECT 
        T.jsonPayload.blockNumber as blockNumber,
        T.jsonPayload.from,
        log
      FROM 
        `{table_path}` as T
      CROSS JOIN UNNEST(T.jsonPayload.logs) as log
      WHERE 
        T.jsonPayload.event='{EventTypes.RECEIVED_TRANSACTION_RECEIPT.value}' and
        T.jsonPayload.blockNumber >= {window_min} and
        T.jsonPayload.blockNumber <= {window_max}
    ORDER BY blockNumber DESC)
    SELECT
      l.blockNumber,
      l.from,
      l.log.address,
      topic
    FROM logQuery as l
    CROSS JOIN UNNEST(l.log.topics) as topic;
    """

    df_receipt = client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[]
        )
    )
    df_receipt = df_receipt.to_dataframe()
    return df_receipt
