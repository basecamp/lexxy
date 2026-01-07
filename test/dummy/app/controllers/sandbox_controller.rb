class SandboxController < ApplicationController
  def show
  end

  def load_content
    partial_name = params[:partial]
    render partial: partial_name, layout: false
  end
end
