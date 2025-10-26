---
title: slotMaxTime
---

Determines the last time slot that will be displayed for each day. In line with the discussion about the [Event object](event-parsing), it is important to stress that this should be specified as an **exclusive** end time.

<div class='spec' markdown='1'>
[Duration](duration-object), *default*: `"24:00:00"`
</div>

The default `"24:00:00"` means the end time will be at the very end of the day (midnight).

Determines the last slot, even when the scrollbars have been scrolled all the way back.
