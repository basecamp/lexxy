import "lexxy"
import { NativeAdapter } from "lexxy"
import "./events_logger.js"

// Exposed for native-adapter Playwright tests under test/browser/tests/native/.
window.LexxyNativeAdapter = NativeAdapter
