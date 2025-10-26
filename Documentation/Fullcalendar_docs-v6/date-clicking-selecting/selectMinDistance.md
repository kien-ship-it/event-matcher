---
title: selectMinDistance
---

The minimum distance the user's mouse must travel after a mousedown, before a selection is allowed.

<div class='spec' markdown='1'>
Integer, *default*: `0`
</div>

The default value of `0` puts no restriction on the distance the mouse must travel.

A non-zero value is useful for differentiating a selection from a [dateClick](dateClick).

This setting is only applicable to mouse-related interaction. For touch interation, see [selectLongPressDelay](selectLongPressDelay).
