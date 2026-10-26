class DemoContentsController < ApplicationController
  def show
    render partial: "sandbox/#{params[:id]}", layout: false
  end
end
