---
title: bootstrapFontAwesome
---

Determines which icons are displayed in buttons of the headerToolbar/footerToolbar when [Bootstrap **4** theming](bootstrap4) is on.
This setting does **not** apply to [Bootstrap **5** theming](bootstrap5). Use [buttonIcons](buttonIcons) instead.

<div class='spec' markdown='1'>
Object, *default:*

```js
{
  close: 'fa-times',
  prev: 'fa-chevron-left',
  next: 'fa-chevron-right',
  prevYear: 'fa-angle-double-left',
  nextYear: 'fa-angle-double-right'
}
```
</div>

This option only applies to calendars that have [themeSystem](themeSystem) set to `'bootstrap'` (Bootstrap 4). A FontAwesome stylesheet must be loaded before you can use Bootstrap 4 theming or customize the icons. [Getting started with FontAwesome](https://fontawesome.com/get-started).

A hash must be supplied that maps button names (from the [headerToolbar](headerToolbar)) to icon strings. [See a full list of FontAwesome icons](https://fontawesome.com/icons).

If a button does not have an entry, it falls back to using [buttonText](buttonText).

If you are using a Bootstrap theme and would prefer not to display any icons and would rather use `buttonText` instead, you can set the `bootstrapFontAwesome` option to `false`.
