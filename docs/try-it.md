---
title: Try it
layout: default
nav_order: 2
---

# Try the Editor

{::nomarkdown}
<link rel="stylesheet" href="https://unpkg.com/@37signals/lexxy@latest/dist/stylesheets/lexxy.css">
<script type="importmap">
{
  "imports": {
    "@37signals/lexxy": "https://esm.sh/@37signals/lexxy@latest",
  }
}
</script>
<script type="module" src="{{ '/assets/js/try-it.js' | relative_url }}"></script>

<lexxy-editor class="lexxy-content" placeholder="Write something…">
</lexxy-editor>
{:/nomarkdown}
