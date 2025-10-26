---
title: displayEventTime
---

Whether or not to display the text for an event's date/time.

<div class='spec' markdown='1'>
Boolean
</div>

This setting only applies to events that have times (`allDay` equal to `false`). If set to `true`, time text will always be displayed on the event. If set to `false`, time text will never be displayed on the event.

Events that are all-day will never display time text anyhow.

When this setting is not specified, the default that is computed is based off of the current view. For example, time text will be displayed in all *DayGrid*, and *TimeGrid* views by default. For [timeline views](timeline-view), it depends on the duration.
