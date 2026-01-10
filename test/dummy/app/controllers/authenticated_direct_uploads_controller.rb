class AuthenticatedDirectUploadsController < ActiveStorage::DirectUploadsController
  skip_forgery_protection

  before_action :require_auth_cookie

  private
    def require_auth_cookie
      unless cookies[:auth_token].present?
        head :unauthorized
      end
    end
end
