---
title: hiddenDays
---

Exclude certain days-of-the-week from being displayed.

<div class='spec' markdown='1'>
Array, *default*: `[]`
</div>

The value is an array of day-of-week indices to hide. Each index is zero-base (Sunday=`0`) and ranges from `0-6`. Example:

```js
hiddenDays: [ 2, 4 ] // hide Tuesdays and Thursdays

hiddenDays: [ 1, 3, 5 ] // hide Mondays, Wednesdays, and Fridays
```

By default, no days are hidden, unless [weekends](weekends) is set to `false`.
