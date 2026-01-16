import copy from 'rollup-plugin-copy';

const helperChunks = [
  "prismjs",
  "code_highlighting_helper"
]

export default {
  input: { lexxy: "src/index.js" },
  output: {
    dir: "./dist",
    format: "esm",
    entryFileNames: "[name].esm.js",

    // Force a helpers chunk with named exports and without a content hash
    manualChunks: (id) => {
      if (helperChunks.some(file => id.includes(file))) return "lexxy_helpers"
      return null
    },
    chunkFileNames: "[name].esm.js",
    minifyInternalExports: false
  },
  external: [
    /^@lexical\//,
    'lexical',
    'dompurify',
    'marked',
    'prismjs',
    /^prismjs\//,
    '@rails/activestorage'
  ],
  plugins: [
    copy({
      targets: [
        { src: 'app/assets/stylesheets/**/*', dest: 'dist/stylesheets' },
      ]
    })
  ]
}
