---
title: Remote filtering
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 4
---

# Remote filtering

There are scenarios where you want to query the server for filtering, instead of loading all options at once. This is useful for large datasets or complex searches. In this case, you must add the `remote-filtering` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" name="mention" remote-filtering>
</lexxy-prompt>
```

By default, the `SPACE` key will select the current item in the prompt. If you want to allow spaces in the search query, you can add the `supports-space-in-searches` attribute to the prompt. This can be handy to search by full names in combination with remote filtering.

Typing punctuation such as `,` `.` or `'` inserts the selected item, unless one of the items the server returned continues with that punctuation, as `O'Connor` does for `O'`. If your endpoint limits how many items it returns, a name that continues with the punctuation can be left out of the response, and the punctuation then inserts the selected item instead.
