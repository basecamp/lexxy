---
title: Try it
layout: default
nav_order: 2
---

# Try the Editor

{::nomarkdown}
<link rel="stylesheet" href="https://unpkg.com/@37signals/lexxy@latest/dist/stylesheets/lexxy.css">
<script type="module">
  import * as Lexxy from "https://esm.sh/@37signals/lexxy@latest";

  navigator.serviceWorker.register("{{ site.baseurl }}/attachments-sw.js");
</script>

<lexxy-editor
  class="lexxy-content"
  placeholder="Write something…"
  data-direct-upload-url="/rails/active_storage/direct_uploads"
  data-blob-url-template="/rails/active_storage/blobs/:signed_id/:filename">
  <lexxy-prompt trigger=":" insert-editable-text>
    <lexxy-prompt-item search="joy laughing face"><template type="menu">😂 Joy</template><template type="editor">😂</template></lexxy-prompt-item>
    <lexxy-prompt-item search="heart red heart"><template type="menu">❤️ Heart</template><template type="editor">❤️</template></lexxy-prompt-item>
    <lexxy-prompt-item search="thumbs up like"><template type="menu">👍 Thumbs Up</template><template type="editor">👍</template></lexxy-prompt-item>
    <lexxy-prompt-item search="fire hot lit"><template type="menu">🔥 Fire</template><template type="editor">🔥</template></lexxy-prompt-item>
    <lexxy-prompt-item search="party popper celebration"><template type="menu">🎉 Party</template><template type="editor">🎉</template></lexxy-prompt-item>
    <lexxy-prompt-item search="star favorite"><template type="menu">⭐ Star</template><template type="editor">⭐</template></lexxy-prompt-item>
    <lexxy-prompt-item search="clap applause"><template type="menu">👏 Clap</template><template type="editor">👏</template></lexxy-prompt-item>
    <lexxy-prompt-item search="rocket launch"><template type="menu">🚀 Rocket</template><template type="editor">🚀</template></lexxy-prompt-item>
    <lexxy-prompt-item search="100 hundred perfect"><template type="menu">💯 100</template><template type="editor">💯</template></lexxy-prompt-item>
    <lexxy-prompt-item search="checkmark check mark"><template type="menu">✅ Check</template><template type="editor">✅</template></lexxy-prompt-item>
    <lexxy-prompt-item search="heart eyes love"><template type="menu">😍 Heart Eyes</template><template type="editor">😍</template></lexxy-prompt-item>
    <lexxy-prompt-item search="thinking thought"><template type="menu">🤔 Thinking</template><template type="editor">🤔</template></lexxy-prompt-item>
    <lexxy-prompt-item search="wink wink"><template type="menu">😉 Wink</template><template type="editor">😉</template></lexxy-prompt-item>
    <lexxy-prompt-item search="celebrate party"><template type="menu">🎊 Celebrate</template><template type="editor">🎊</template></lexxy-prompt-item>
    <lexxy-prompt-item search="muscle flex strong"><template type="menu">💪 Muscle</template><template type="editor">💪</template></lexxy-prompt-item>
    <lexxy-prompt-item search="lightbulb idea"><template type="menu">💡 Lightbulb</template><template type="editor">💡</template></lexxy-prompt-item>
    <lexxy-prompt-item search="thumbs down dislike"><template type="menu">👎 Thumbs Down</template><template type="editor">👎</template></lexxy-prompt-item>
    <lexxy-prompt-item search="pray hands thank"><template type="menu">🙏 Pray</template><template type="editor">🙏</template></lexxy-prompt-item>
    <lexxy-prompt-item search="clown face funny"><template type="menu">🤡 Clown</template><template type="editor">🤡</template></lexxy-prompt-item>
    <lexxy-prompt-item search="crown king queen"><template type="menu">👑 Crown</template><template type="editor">👑</template></lexxy-prompt-item>
  </lexxy-prompt>
</lexxy-editor>
{:/nomarkdown}
