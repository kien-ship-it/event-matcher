---
title: Calendar::next
type: method
---

Moves the calendar one step forward (by a month or week for example).

<div class='spec' markdown='1'>
calendar.next()
</div>

If the calendar is in `dayGridMonth` view, will move the calendar forward one month.

If the calendar is in `dayGridWeek` or `timeGridWeek`, will move the calendar forward one week.

If the calendar is in `dayGridDay` or `timeGridDay`, will move the calendar forward one day.

Example using `next` with an external button:

```js
document.getElementById('my-next-button').addEventListener('click', function() {
  calendar.next();
});
```

[View a demo](date-api-buttons-demo) that uses the prev and next methods.
