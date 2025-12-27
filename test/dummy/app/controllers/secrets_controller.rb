class SecretsController < ApplicationController
	before_action :set_secret, only: %i[ show edit update destroy ]

	# GET /secrets
	def index
	  @secrets = Secret.all
	end

	# GET /secrets/1
	def show
	end

	# GET /secrets/new
	def new
	  @secret = Secret.new
	end

	# GET /secrets/1/edit
	def edit
	end

	# POST /secrets
	def create
	  @secret = Secret.new(secret_params)

	  if @secret.save
	    redirect_to @secret, notice: "Secret was successfully created."
	  else
	    render :new, status: :unprocessable_entity
	  end
	end

	# PATCH/PUT /secrets/1
	def update
	  if @secret.update(secret_params)
	    if params[:refresh]
	      redirect_back_or_to @secret
	    else
	      redirect_to @secret, notice: "Secret was successfully updated.", status: :see_other
	    end
	  else
	    render :edit, status: :unprocessable_entity
	  end
	end

	# DELETE /secrets/1
	def destroy
	  @secret.destroy!
	  redirect_to secrets_path, notice: "Secret was successfully destroyed.", status: :see_other
	end

	private
	  # Use callbacks to share common setup or constraints between actions.
	  def set_secret
	    @secret = Secret.find(params[:id])
	  end

	  # Only allow a list of trusted parameters through.
	  def secret_params
	    params.require(:secret).permit(:title, :body)
	  end
end
