---
title: Vertical Resource View
title_for_landing: Vertical Resource
is_premium: true
children:
  - datesAboveResources
  - resource-daygrid-view
demos:
  - vertical-resource-standard-demo
  - vertical-resource-custom-demo
  - datesAboveResources-demo
  - vertical-resource-render-hook-demo
---

[FullCalendar Premium](/pricing) provides [TimeGrid view](timegrid-view) and [DayGrid view](daygrid-view) with the ability to display **resources as columns**. For example, a TimeGrid `day` resource view can be initialized in an [ES6 setup](initialize-es6) like so:

```
npm install --save \
  @fullcalendar/core \
  @fullcalendar/resource \
  @fullcalendar/resource-timegrid
```

```js
import { Calendar } from '@fullcalendar/core';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
...
let calendar = new Calendar(calendarEl, {
  plugins: [ resourceTimeGridPlugin ],
  initialView: 'resourceTimeGridDay',
  resources: [
    // your list of resources
  ]
});
...
```

Or, you can choose to initialize it with the `fullcalendar-scheduler` [global bundle](initialize-globals):

```html
<script src='fullcalendar-scheduler/dist/index.global.js'></script>
<script>
...
var calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'resourceTimeGridDay',
  resources: [
    // your list of resources
  ]
});
...
</script>
```

[DayGrid requires a similar setup &raquo;](resource-daygrid-view)

The following options are specific to Vertical Resource view. However, there are numerous other options throughout the docs that affect the display of Vertical Resource view, such as the [locale-related options](localization), [date/time display options](date-display), and [resource display options](resource-display).
