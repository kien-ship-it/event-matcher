---
title: Calendar::formatDate
---

A method that formats a date into a string. It inherits the locale and time zone settings of the calendar it's called on.

<div class='spec' markdown='1'>
calendar.formatDate( *date*, *settings* )
</div>

`date` can be a [Date Object](date-object) or something that will [parse into a Date Object](date-parsing).

`settings` is an object that holds any of the [date format config](date-formatting) options.

Example:

```js
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');

  var calendar = new Calendar(calendarEl, {
    plugins: [ dayGridPlugin ],
    timeZone: 'UTC',
    locale: 'es'
  });

  var str = calendar.formatDate('2018-09-01', {
    month: 'long',
    year: 'numeric',
    day: 'numeric'
  });

  console.log(str); // "1 de septiembre de 2018 0:00 UTC"
});
```
