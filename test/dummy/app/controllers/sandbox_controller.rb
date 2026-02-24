class SandboxController < ApplicationController
  ALLOWED_TEMPLATES = %w[default tables code lists highlights images empty]

  def show
    @template = if params[:template].presence_in ALLOWED_TEMPLATES
      params[:template]
    else
      "default"
    end
  end
end
