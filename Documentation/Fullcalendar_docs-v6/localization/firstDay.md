---
title: firstDay
---

The day that each week begins.

<div class='spec' markdown='1'>
Integer, *default*: `0` (Sunday)
</div>

The default value depends on the current [locale](locale).

The value must be a number that represents the day of the week.

Sunday=`0`, Monday=`1`, Tuesday=`2`, etc.

If [weekNumberCalculation](weekNumberCalculation) is set to `'ISO'`, this option defaults to `1` (Monday).
