import copy from 'rollup-plugin-copy';

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
  ],
  plugins: [
    copy({
      targets: [
        { src: 'app/assets/stylesheets/**/*', dest: 'dist/stylesheets' },
      ]
    })
  ]
}
