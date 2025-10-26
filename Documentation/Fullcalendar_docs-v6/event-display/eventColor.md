---
title: eventColor
---

Sets the background *and* border colors for all events on the calendar.

<div class='spec' markdown='1'>
String
</div>

You can change the color of all events on the calendar like so:

```js
var calendar = new Calendar(calendarEl, {
  events: [
    // my event data
  ],
  eventColor: '#378006'
});
```

You can use any of the CSS color formats such `#f00`, `#ff0000`, `rgb(255,0,0)`, or `red`.

The [eventBackgroundColor](eventBackgroundColor), [eventBorderColor](eventBorderColor), and [eventTextColor](eventTextColor) options can be used for more granularity.

This option can be overridden on a per-source basis with the `color` [Event Source Object](event-source-object) option or on a per-event basis with the `color` [Event Object](event-object) option.
