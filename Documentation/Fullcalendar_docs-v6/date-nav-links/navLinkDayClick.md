---
title: navLinkDayClick
type: callback
---

Determines what happens upon a day heading nav-link click.

<div class='spec' markdown='1'>
view name (string), function
</div>

By default, the user is taken to the first day-view that appears in the [headerToolbar](headerToolbar).

A string argument can be provided that navigates the user to a specific view.

Also, a function argument can be provided that executes arbitrary code:

```js
var calendar = new Calendar(calendarEl, {
  navLinks: true,
  navLinkDayClick: function(date, jsEvent) {
    console.log('day', date.toISOString());
    console.log('coords', jsEvent.pageX, jsEvent.pageY);
  }
});
```

When a custom function is specified, the user will not automatically navigate to any view.


## Note about `dateClick`

When `navLinkDayClick` fires, the [dateClick](dateClick) callback will NOT be fired.
