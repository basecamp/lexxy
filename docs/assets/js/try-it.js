import * as Lexxy from "@37signals/lexxy"
import { DemoExtension } from "./demo_extension.js"

Lexxy.configure({
  global: {
    extensions: [DemoExtension]
  }
})
