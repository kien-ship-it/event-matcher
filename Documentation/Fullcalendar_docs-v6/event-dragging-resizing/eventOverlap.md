---
title: eventOverlap
---

Determines if events being dragged and resized are allowed to overlap each other.

<div class='spec' markdown='1'>
boolean / function. *default*: `true`
</div>

If `false`, no events are allowed to overlap. If `true`, all events are allowed to overlap (the default).

If given a function, the function will be called every time there is a pair of intersecting events, whether upon a user drag or resize. The function must return `true` if the overlap should be allowed and `false` otherwise. The below example allows overlapping only if both events are all-day:

```js
var calendar = new Calendar(calendarEl, {
  events: [ /* event data here */ ]
  eventOverlap: function(stillEvent, movingEvent) {
    return stillEvent.allDay && movingEvent.allDay;
  }
});
```

`movingEvent` is the event that is being dragged or resized. Its `start` and `end` dates will remain at their original values when the callback function is called. `stillEvent` is the event underneath the moving event.

If a timed event occurs on the same day as an all-day event, this will qualify as an intersection. This might seem confusing in the TimeGrid views because the events don't visually intersect because the all-day slot is separate from the timed slots. But it's still considered an overlap.

The `eventOverlap` setting does not differentiate between [background events](background-events) or normal events. It treats both types of events the same way.

If you need more granular control for which events are allowed to overlap, you can do this with each [Event Source](event-source-object)'s `overlap` property or with each [Event Object](event-object)'s `overlap` property. [View a demo](event-constraint-demo) that does this.
