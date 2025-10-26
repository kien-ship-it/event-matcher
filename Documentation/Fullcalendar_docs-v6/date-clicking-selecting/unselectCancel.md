---
title: unselectCancel
---

A way to specify elements that will ignore the [unselectAuto](unselectAuto) option.

<div class='spec' markdown='1'>
String, *default*: `''`
</div>

Clicking on elements that match this [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) will prevent the current selection from being cleared (due to the [unselectAuto](unselectAuto) option).

This option is useful if you have a "Create an event" form that shows up in response to the user making a selection. When the user clicks on this form, you probably don't want to the current selection to go away. Thus, you should add a class to your form such as "my-form", and set the `unselectCancel` option to `".my-form"`.
