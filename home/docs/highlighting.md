---
title: Highlighting
layout: default
parent: Configuration
nav_order: 1
has_children: true
---

# Highlighting Configuration

You can customize the colors which Lexxy uses to highlight text

The simplest way to customize highlighting is override the CSS variables provided:
- `color`: `var(--highlight-1)` to `var(--highlight-9)`
- `background-color`: `var(--highlight-bg-1)` to `var(--highlight-bg-9)`

To override the styles applied by Lexxy, configure `highlight.buttons.color` and `highlight.buttons.background-color`. Further, since Lexxy sanitizes pasted styles, `highlight.permit.color` and `highlight.permit.background-color` allows you to add additional colors which Lexxy will conserve on paste but are not presented as buttons in the toolbar.

```javascript
Lexxy.configure({
  default: {
    highlight: {
      buttons: {
        color: [ "red", "rgb(255, 0, 0)", "var(--text-color-1)" ],
        "background-color": [ "red", "rgba(0, 255, 0, 0.5)", "var(--bg-color-1)" ]
      },
      permit: {
        color: [ "pink", "blue", "var(--legacy-text-color)" ],
        "background-color": [ "light-pink", "light-blue", "var(--legacy-bg-color)" ],
      }
    }
  }
})
```

## Custom color labels

Use `{ value, label }` entries to give custom colors a readable name for screen readers. `value` is the CSS color; `label` is the name of the button in the color menu.

```javascript
Lexxy.configure({
  default: {
    highlight: {
      buttons: {
        color: [
          { value: "#124e78", label: "Deep blue" },
          { value: "var(--brand-color)", label: "Brand purple" }
        ],
        "background-color": [
          { value: "#fff3b0", label: "Pale yellow" }
        ]
      }
    }
  }
})
```

Lexxy groups the buttons under **Text color** and **Background color** and indicates the selected colors. String entries use the CSS value as their accessible name. Labels make hex values and CSS variables easier to identify.
