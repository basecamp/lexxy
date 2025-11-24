require "action_text/attachables/remote_video"

module Lexxy
  module Attachable
    def from_node(node)
      attachable = super

      if attachable.is_a?(ActionText::Attachables::MissingAttachable)
        ActionText::Attachables::RemoteVideo.from_node(node) || attachable
      else
        attachable
      end
    end
  end
end
