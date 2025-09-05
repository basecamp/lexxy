export default {
  input: "./src/index.js",
  output: {
    file: "./dist/lexxy.esm.js",
    format: "esm"
  },
  external: [
    /^@lexical\//,
    'lexical',
    'dompurify',
    'marked',
    'prismjs',
    /^prismjs\//,
    '@rails/activestorage'
  ]
}