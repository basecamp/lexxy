# Pin npm packages by running ./bin/importmap

pin "application"

pin "@rails/actiontext", to: "actiontext.esm.js"
pin "lexxy", to: "lexxy.js"
pin "@rails/activestorage", to: "activestorage.esm.js"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin "@rails/request.js", to: "@rails--request.js" # @0.0.11

pin_all_from "app/javascript/controllers", under: "controllers"

# Sandbox
pin "prismjs"
pin "prettier"
pin "prettier/parser-html", to: "prettier--parser-html.js"
pin "marked", to: "https://ga.jspm.io/npm:marked@16.4.0/lib/marked.esm.js"
