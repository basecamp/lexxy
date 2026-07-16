import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import inject from "@rollup/plugin-inject"
import terser from "@rollup/plugin-terser"
import gzipPlugin from "rollup-plugin-gzip"

import { brotliCompress } from "zlib"
import { promisify } from "util"

/* global Buffer */
const brotliPromise = promisify(brotliCompress)

// Interim workaround for facebook/lexical#2495. On Safari, a collapsed caret in
// RTL text yields a degenerate, out-of-bounds bounding rect, so Lexical's
// scrollIntoViewIfNeeded scrolls the window up on every space/backspace and the
// editor jumps off-screen. A caret that lives inside the editor cannot lie
// entirely outside the editor's own box; when the rect says it does, the rect is
// unreliable, so skip the scroll. This injects that guard into the bundled
// lexical at build time (the Rails-engine build bundles lexical; the npm build
// externalizes it). Remove once a fixed lexical release is adopted upstream.
function guardLexicalScrollIntoView() {
  const PROD_ANCHOR = "if(null===r||null===i)return;let{top:o,bottom:s}=e,l=0,c=0,a=n;"
  const PROD_GUARD = "if(null===r||null===i)return;const $lxsr=n.getBoundingClientRect();if(e.bottom<$lxsr.top||e.top>$lxsr.bottom)return;let{top:o,bottom:s}=e,l=0,c=0,a=n;"
  const DEV_ANCHOR = "  if (doc === null || defaultView === null) {\n    return;\n  }\n  let {\n    top: currentTop,\n    bottom: currentBottom\n  } = selectionRect;"
  const DEV_GUARD = "  if (doc === null || defaultView === null) {\n    return;\n  }\n  // Injected by Lexxy — skip scroll on a bogus caret rect (Safari RTL). facebook/lexical#2495.\n  const rootRect = rootElement.getBoundingClientRect();\n  if (selectionRect.bottom < rootRect.top || selectionRect.top > rootRect.bottom) {\n    return;\n  }\n  let {\n    top: currentTop,\n    bottom: currentBottom\n  } = selectionRect;"

  let applied = 0
  return {
    name: "guard-lexical-scroll-into-view",
    transform(code, id) {
      if (!id.includes("/node_modules/lexical/")) return null
      let out = code
      if (out.includes(PROD_ANCHOR)) out = out.replace(PROD_ANCHOR, PROD_GUARD)
      if (out.includes(DEV_ANCHOR)) out = out.replace(DEV_ANCHOR, DEV_GUARD)
      if (out === code) return null
      applied++
      return { code: out, map: null }
    },
    buildEnd() {
      if (applied === 0) {
        this.error("guard-lexical-scroll-into-view: lexical's scrollIntoViewIfNeeded anchor was not found. The workaround for facebook/lexical#2495 did not apply — re-verify it against the current lexical version.")
      }
    }
  }
}

export default [
  {
    input: "./src/index.js",
    output: [
      {
        file: "./app/assets/javascript/lexxy.js",
        format: "esm",
        sourcemap: true
      },
      {
        file: "./app/assets/javascript/lexxy.min.js",
        format: "esm",
        plugins: [ terser() ]
      }
    ],
    external: [
      "@rails/activestorage"
    ],
    plugins: [
      guardLexicalScrollIntoView(),
      nodeResolve(),
      commonjs(),
      // Inject Prism for prismjs language components that expect a global Prism
      inject({
        Prism: ["prismjs", "default"],
        include: "**/prismjs/components/**"
      }),
      gzipPlugin({
        gzipOptions: { level: 9 }
      }),
      gzipPlugin({
        customCompression: content => brotliPromise(Buffer.from(content)),
        fileName: ".br"
      })
    ]
  }
]
