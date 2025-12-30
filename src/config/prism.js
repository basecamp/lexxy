// Manual highlighting mode to prevent invocation on every page. See https://prismjs.com/docs/prism
// This must happen before importing any Prism components
window.Prism ||= {}
Prism.manual = true

// Additional Prism languages need to be imported before the editor is loaded, otherwise they are not highlighted on inital load
import "prismjs/components/prism-markup-templating"
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-go"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-diff"
