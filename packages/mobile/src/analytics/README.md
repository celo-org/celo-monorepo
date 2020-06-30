# Analytics

The analytics module currently supports two primary use cases:

- component-level generic wrapping for common lifecycle events
- custom event tracking

## Usage

Only whitelisted properties (as declared [here](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/src/analytics/constants.ts)) will be sent out to Segment. Any new properties that need to be tracked therefore need to be added to this list.

## Custom Event Tracking

Make a call to ValoraAnalytics.track() with the event name and any associated properties that should be tracked as part of this event.

## PILOT_ONLY flag

If there are fields we don't wish to track beyond the pilot(this includes any sensitive information), please flag them with a // PILOT_ONLY comment to flag them for removal prior to non-pilot usage.

## FAQ + Best Practices

Avoid tracking events on every keystroke/edit, as these use unnecessary data to generate and send out. Use onEndEditing() or log an event with the state of form inputs on form submission

Track events after the action being tracked has been completed. This prevents us sending out analytics events that indicate success of an action that subsequently fails.
