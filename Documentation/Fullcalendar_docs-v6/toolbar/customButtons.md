---
title: customButtons
---

Defines custom buttons that can be used in the headerToolbar/footerToolbar.

<div class='spec' markdown='1'>
Object
</div>

Specify a hash of custom buttons. Then reference them from the `headerToolbar` setting. Like this:

```js
var calendar = new Calendar(calendarEl, {
  customButtons: {
    myCustomButton: {
      text: 'custom!',
      click: function() {
        alert('clicked the custom button!');
      }
    }
  },
  headerToolbar: {
    left: 'prev,next today myCustomButton',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  }
});
```

Each `customButton` entry accepts the following properties:

- `text` - the text to be display on the button itself
- `hint` - the [accessibility hint](hints). defaults to `text`
- `click` - a callback function that is called when the button is clicked. Accepts two arguments: <code>( <a href='https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent'>mouseEvent</a>, <a href='https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement'>htmlElement</a> ).
- `icon` - see [buttonIcons](buttonIcons). optional
- `bootstrapFontAwesome` - see [bootstrapFontAwesome](bootstrapFontAwesome). optional

[See a demo of customButtons](toolbar-demo).
