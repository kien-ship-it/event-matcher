---
title: timeZoneParam
---

A parameter of this name will be sent to each JSON event feed. It describes the timezone of the [startParam](startParam) and [endParam](endParam) values, as well as the desired timezone of the returned events.

<div class='spec' markdown='1'>
String, *default*: `'timeZone'`
</div>

The value of this parameter will be a timezone string like `"America/Chicago"` or `"UTC"`. For `local`, it will be unspecified. See the [timeZone setting](timeZone) for more info.
