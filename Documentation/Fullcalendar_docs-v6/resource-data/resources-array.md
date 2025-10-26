---
title: resources (as an array)
---

Tells the calendar to display resources from an array input.

```js
var calendar = new Calendar(calendarEl, {
  resources: [
    {
      id: 'a',
      title: 'Room A'
    },
    {
      id: 'b',
      title: 'Room B'
    }
  ]
});
```

The `id` property is the most important because it allows [associating events with resources](resources-and-events). See [Resource parsing](resource-parsing) spec for a full list of fields.
