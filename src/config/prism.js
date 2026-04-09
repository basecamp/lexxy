// Configure Prism for manual highlighting mode
// This must be set before importing prismjs
window.Prism ||= {}
window.Prism.manual = true

// Prism and base @lexical/code languages
// Don't reorder: they extend each other
import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-diff"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-markdown"
import "prismjs/components/prism-c"
import "prismjs/components/prism-css"
import "prismjs/components/prism-objectivec"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-powershell"
import "prismjs/components/prism-python"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-swift"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-java"
import "prismjs/components/prism-cpp"


// Import extra base language dependencies
import "prismjs/components/prism-markup-templating"

// Import extra languages
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-go"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"

export default Prism
