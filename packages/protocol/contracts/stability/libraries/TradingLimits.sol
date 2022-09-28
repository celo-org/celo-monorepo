// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { console } from "forge-std/console.sol";

library TradingLimits {
  struct Counts {
    Interval interval0;
    Interval interval1;
    Interval interval2;
    Interval allTime;
  }

  struct Interval {
    int256 count;
    uint256 last_timestamp;
    int256 limit;
    uint256 duration;
    bool enabled;
  }

  function decodeInterval(Interval memory interval, uint256 slot, uint256 offset, bool isAllTime)
    internal
    returns (Interval memory)
  {
    interval.count = int256(int32(slot >> offset));
    interval.limit = int256(int32(slot >> (offset + 32)));

    if (isAllTime) return interval;

    interval.last_timestamp = uint256(uint32(slot >> (offset + 64)));
    interval.duration = uint256(uint32(slot >> (offset + 96)));

    if (interval.last_timestamp + interval.duration > block.timestamp) {
      interval.count = 0;
      interval.last_timestamp +=
        interval.duration *
        ((block.timestamp - interval.last_timestamp) / interval.duration);
    }
    return interval;
  }

  function decode(uint256 s0, uint256 s1) internal returns (Counts memory tc) {
    tc.interval0.enabled = (uint16(s1 >> 192) & 1) == 1;
    tc.interval1.enabled = (uint16(s1 >> 192) & 2) == 1;
    tc.interval2.enabled = (uint16(s1 >> 192) & 4) == 1;
    tc.allTime.enabled = (uint16(s1 >> 192) & 8) == 1;

    if (tc.interval0.enabled) tc.interval0 = decodeInterval(tc.interval0, s0, 0, false);
    if (tc.interval1.enabled) tc.interval1 = decodeInterval(tc.interval1, s0, 128, false);
    if (tc.interval2.enabled) tc.interval2 = decodeInterval(tc.interval1, s1, 0, false);
    if (tc.allTime.enabled) tc.interval2 = decodeInterval(tc.allTime, s1, 128, false);
  }

  function encode(Counts memory self) internal returns (uint256 s0, uint256 s1) {
    if (self.interval1.enabled) {
      s0 |= self.interval1.duration << 224;
      s0 |= self.interval1.last_timestamp << 192;
      s0 |= uint256(uint32(self.interval1.limit)) << 160;
      s0 |= uint256(uint32(self.interval1.count)) << 128;
    }

    if (self.interval0.enabled) {
      s0 |= self.interval0.duration << 96;
      s0 |= self.interval0.last_timestamp << 64;
      s0 |= uint256(uint32(self.interval0.limit)) << 32;
      s0 |= uint32(self.interval0.count);
    }

    s1 |=
      uint256(
        (self.interval0.enabled ? 1 : 0) +
          (self.interval1.enabled ? 2 : 0) +
          (self.interval2.enabled ? 4 : 0) +
          (self.allTime.enabled ? 8 : 0)
      ) <<
      192;
    if (self.allTime.enabled) {
      s1 |= uint256(uint32(self.allTime.limit)) << 160;
      s1 |= uint256(uint32(self.allTime.count)) << 128;
    }

    if (self.interval2.enabled) {
      s1 |= self.interval2.duration << 96;
      s1 |= self.interval2.last_timestamp << 64;
      s1 |= uint256(uint32(self.interval2.limit)) << 32;
      s1 |= uint256(uint32(self.interval2.count));
    }
  }

  function add(Counts memory self, uint256 _value) internal returns (Counts memory) {
    require(_value < (1 << 255));
    int256 value = int256(_value / 1e18);

    if (self.interval0.enabled) self.interval0.count += value;
    if (self.interval1.enabled) self.interval1.count += value;
    if (self.interval2.enabled) self.interval2.count += value;
    if (self.allTime.enabled) self.allTime.count += value;

    return self;
  }

  function subtract(Counts memory self, uint256 _value) internal returns (Counts memory) {
    require(_value < (1 << 255));
    int256 value = int256(_value / 1e18);

    if (self.interval0.enabled) self.interval0.count -= value;
    if (self.interval1.enabled) self.interval1.count -= value;
    if (self.interval2.enabled) self.interval2.count -= value;
    if (self.allTime.enabled) self.allTime.count -= value;

    return self;
  }

  function validate(Counts memory self) internal returns (Counts memory) {
    require(
      !self.interval0.enabled || abs(self.interval0.count) < self.interval0.limit,
      "I0 limit met"
    );
    require(
      !self.interval1.enabled || abs(self.interval1.count) < self.interval1.limit,
      "I1 limit met"
    );
    require(
      !self.interval2.enabled || abs(self.interval2.count) < self.interval2.limit,
      "I2 limit met"
    );
    require(!self.allTime.enabled || abs(self.allTime.count) < self.allTime.limit, "AT limit met");

    return self;
  }

  function abs(int256 x) private pure returns (int256) {
    return x >= 0 ? x : -x;
  }

  function setTimestampsToNow(Counts memory self) internal returns (Counts memory) {
    if (self.interval0.enabled) self.interval0.last_timestamp = block.timestamp;
    if (self.interval1.enabled) self.interval1.last_timestamp = block.timestamp;
    if (self.interval2.enabled) self.interval2.last_timestamp = block.timestamp;
    if (self.allTime.enabled) self.allTime.last_timestamp = block.timestamp;

    return self;
  }

  function anyEnabled(Counts memory self) internal returns (bool) {
    return
      self.interval0.enabled ||
      self.interval1.enabled ||
      self.interval2.enabled ||
      self.allTime.enabled;
  }

  function log(Counts memory self) internal {
    logInterval("interval0", self.interval0, false);
    logInterval("interval1", self.interval1, false);
    logInterval("interval2", self.interval2, false);
    logInterval("allTime", self.allTime, true);
  }

  function logInterval(string memory prefix, Interval memory interval, bool isAllTime) internal {
    console.log(string(abi.encodePacked(prefix, ".count")));
    console.logInt(interval.count);
    console.log(string(abi.encodePacked(prefix, ".limit")));
    console.logInt(interval.limit);
    if (!isAllTime) {
      console.log(string(abi.encodePacked(prefix, ".last_timestamp")), interval.last_timestamp);
      console.log(string(abi.encodePacked(prefix, ".duration")), interval.duration);
    }
    console.log(string(abi.encodePacked(prefix, ".enabled")), interval.enabled);
  }
}
