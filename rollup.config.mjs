import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import inject from "@rollup/plugin-inject"
import terser from "@rollup/plugin-terser"
import gzipPlugin from "rollup-plugin-gzip"

import { brotliCompress } from "zlib"
import { promisify } from "util"

/* global Buffer */
const brotliPromise = promisify(brotliCompress)

export default [
  {
    input: "./src/index.js",
    output: [
      {
        file: "./app/assets/javascript/lexxy.js",
        format: "esm",
        sourcemap: process.env.NODE_ENV === "development" // eslint-disable-line no-undef
      },
      {
        file: "./app/assets/javascript/lexxy.min.js",
        format: "esm",
        plugins: [ terser() ]
      }
    ],
    plugins: [
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
