class SandboxController < ApplicationController
  ALLOWED_TEMPLATES = %w[default tables code_blocks lists highlights images empty].freeze

  def show
    @template = if params[:template].present? && ALLOWED_TEMPLATES.include?(params[:template])
      params[:template]
    else
      "default"
    end
  end
end
