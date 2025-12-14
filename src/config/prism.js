// Configure Prism for manual highlighting mode
// This must be set before importing prismjs
window.Prism = window.Prism || {}
window.Prism.manual = true

import "prismjs"

// Import base language dependencies first
import "prismjs/components/prism-clike"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-markup-templating"

// Import languages
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-go"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-diff"
