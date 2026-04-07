class TrixPostsController < ApplicationController
  before_action :set_post, only: %i[ show edit update ]
  before_action :canonicalize_trix_body, only: %i[ create update ]

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params)

    if @post.save
      redirect_to trix_post_path(@post), notice: "Post was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
  end

  def edit
  end

  def update
    if @post.update(post_params)
      redirect_to trix_post_path(@post), notice: "Post was successfully updated.", status: :see_other
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private
    def set_post
      @post = Post.find(params[:id])
    end

    def post_params
      params.require(:post).permit(:title, :body)
    end

    # When the global editor is Lexxy, Trix-submitted content still contains
    # figure[data-trix-attachment] elements that need converting to canonical
    # action-text-attachment form. Run it through TrixEditor's canonicalization
    # before ActionText::Content picks it up.
    def canonicalize_trix_body
      return unless Lexxy.supports_editor_adapter? && params.dig(:post, :body).present?

      require "action_text/editor/trix_editor"
      trix_editor = ActionText::Editor::TrixEditor.new
      fragment = ActionText::Fragment.wrap(params[:post][:body])
      params[:post][:body] = trix_editor.as_canonical(fragment).to_html
    end
end
