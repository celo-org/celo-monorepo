"""Unit tests for how a run picks its Dune execution.

A run may resume an execution an earlier attempt of the SAME run left behind,
but it must never pay out from an old one: that would be yesterday's snapshot,
computed with whatever query text was live at the time.
"""

import os
import sys
import time
import urllib.error

import pytest

sys.path.insert(0, os.path.dirname(__file__))
import main  # noqa: E402

ROWS = [{"wallet": "0x6d2c5e1fa357c62e671b289e0ff7fc89accd8b3a", "owed_usat": 0.2, "paid_out_usat": 0}]


class FakeDune:
    """Stands in for main.dune_api: records calls, hands out one new execution."""

    def __init__(self, state="QUERY_STATE_COMPLETED"):
        self.state = state
        self.executed = 0
        self.polled = []

    def __call__(self, path, key, body=None):
        if path.endswith("/execute"):
            self.executed += 1
            return {"execution_id": "NEW"}
        if path.endswith("/status"):
            self.polled.append(path.split("/")[2])
            return {"state": self.state}
        return {"result": {"rows": ROWS}}


@pytest.fixture
def store(tmp_path, monkeypatch):
    monkeypatch.setattr(main.time, "sleep", lambda _seconds: None)
    monkeypatch.delenv("PENDING_MAX_AGE_SECONDS", raising=False)
    return main.LocalStore(str(tmp_path))


def test_recent_marker_is_resumed_without_a_new_execution(store, monkeypatch):
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "RUNNING", "started_at": time.time() - 600})

    assert main.fetch_dune_rows("key", "0xabc", store) == ROWS
    assert dune.executed == 0 and set(dune.polled) == {"RUNNING"}
    assert store.get_json(main.PENDING_OBJECT) is None


def test_stale_marker_is_discarded_and_a_fresh_execution_started(store, monkeypatch):
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "YESTERDAY", "started_at": time.time() - 20 * 3600})

    assert main.fetch_dune_rows("key", "0xabc", store) == ROWS
    assert dune.executed == 1 and set(dune.polled) == {"NEW"}


def test_marker_without_a_start_time_counts_as_stale(store, monkeypatch):
    # Markers written before start times were recorded carry only the id.
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "UNDATED"})

    main.fetch_dune_rows("key", "0xabc", store)
    assert dune.executed == 1 and "UNDATED" not in dune.polled


def test_new_execution_is_recorded_with_its_start_time(store, monkeypatch):
    dune = FakeDune(state="QUERY_STATE_EXECUTING")
    monkeypatch.setattr(main, "dune_api", dune)
    monkeypatch.setenv("DUNE_POLL_SECONDS", "0")
    before = time.time()

    with pytest.raises(main.DuneStillRunning):
        main.fetch_dune_rows("key", "0xabc", store)
    marker = store.get_json(main.PENDING_OBJECT)
    assert marker["execution_id"] == "NEW" and before <= marker["started_at"] <= time.time()


def test_max_age_is_configurable(store, monkeypatch):
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    monkeypatch.setenv("PENDING_MAX_AGE_SECONDS", "60")
    store.put_json(main.PENDING_OBJECT, {"execution_id": "TWO_MINUTES_OLD", "started_at": time.time() - 120})

    main.fetch_dune_rows("key", "0xabc", store)
    assert dune.executed == 1


@pytest.mark.parametrize(
    "marker",
    [
        {"execution_id": "BAD", "started_at": "yesterday"},
        {"execution_id": "BAD", "started_at": None},
        {"execution_id": "BAD", "started_at": True},
        ["BAD"],
    ],
)
def test_malformed_marker_counts_as_stale(store, monkeypatch, marker):
    # A marker we cannot date must never block the run or be trusted.
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    store.put_json(main.PENDING_OBJECT, marker)

    assert main.fetch_dune_rows("key", "0xabc", store) == ROWS
    assert dune.executed == 1 and "BAD" not in dune.polled


def test_marker_dated_in_the_future_counts_as_stale(store, monkeypatch):
    # Otherwise its age stays negative and it would be resumed forever.
    dune = FakeDune()
    monkeypatch.setattr(main, "dune_api", dune)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "FUTURE", "started_at": time.time() + 86400})

    main.fetch_dune_rows("key", "0xabc", store)
    assert dune.executed == 1 and "FUTURE" not in dune.polled


def test_failed_execution_clears_the_marker(store, monkeypatch):
    monkeypatch.setattr(main, "dune_api", FakeDune(state="QUERY_STATE_FAILED"))
    store.put_json(main.PENDING_OBJECT, {"execution_id": "RUNNING", "started_at": time.time()})

    with pytest.raises(RuntimeError):
        main.fetch_dune_rows("key", "0xabc", store)
    assert store.get_json(main.PENDING_OBJECT) is None


def test_execution_dune_no_longer_knows_clears_the_marker(store, monkeypatch):
    # A resumed id Dune rejects would fail every retry the same way; dropping
    # the marker lets the next attempt start a fresh execution.
    def rejecting(path, key, body=None):
        raise urllib.error.HTTPError(path, 404, "Not Found", None, None)

    monkeypatch.setattr(main, "dune_api", rejecting)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "GONE", "started_at": time.time()})

    with pytest.raises(urllib.error.HTTPError):
        main.fetch_dune_rows("key", "0xabc", store)
    assert store.get_json(main.PENDING_OBJECT) is None


def test_dune_outage_keeps_the_marker_for_the_retry(store, monkeypatch):
    def unavailable(path, key, body=None):
        raise urllib.error.HTTPError(path, 503, "Service Unavailable", None, None)

    monkeypatch.setattr(main, "dune_api", unavailable)
    store.put_json(main.PENDING_OBJECT, {"execution_id": "RUNNING", "started_at": time.time()})

    with pytest.raises(urllib.error.HTTPError):
        main.fetch_dune_rows("key", "0xabc", store)
    assert store.get_json(main.PENDING_OBJECT)["execution_id"] == "RUNNING"


def test_run_asks_for_a_retry_while_dune_is_still_running(tmp_path, monkeypatch):
    # Cloud Scheduler only retries on a non-2xx answer; the retry then resumes
    # the same execution instead of the night being skipped.
    monkeypatch.setenv("LOCAL_STATE_DIR", str(tmp_path))
    monkeypatch.setenv("PRIVATE_KEY", "0x" + "11" * 32)
    monkeypatch.setenv("DUNE_API_KEY", "key")

    def still_running(_key, _distributor, _store):
        raise main.DuneStillRunning("NEW")

    monkeypatch.setattr(main, "fetch_dune_rows", still_running)
    body, status = main.distribute(None)
    assert status == 503 and body["execution_id"] == "NEW"
    assert not os.path.exists(os.path.join(str(tmp_path), main.LOCK_OBJECT))
