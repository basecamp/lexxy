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

Lexxy sends the search text in the `filter` query parameter, for example `/people?filter=sutko`. To use a different parameter name, set `filter-param`:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" name="mention" remote-filtering filter-param="query">
</lexxy-prompt>
```

This sends requests such as `/people?query=sutko`. Existing query parameters in `src` are preserved. Omitting `filter-param` or setting it to an empty string uses `filter`.

By default, the `SPACE` key will select the current item in the prompt. If you want to allow spaces in the search query, you can add the `supports-space-in-searches` attribute to the prompt. This can be handy to search by full names in combination with remote filtering.
