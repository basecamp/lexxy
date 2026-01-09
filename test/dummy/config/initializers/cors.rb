Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # allow subdomain of lexxy
    origins /^http:\/\/(([^.]*\.)?lexxy\.)?localhost(:\d+)?$/i

    resource "/authenticated_direct_uploads", methods: :post, headers: :any, credentials: true
    resource "/authenticated_direct_uploads/*", methods: [ :post, :put ], headers: :any, credentials: true
    resource "/rails/active_storage/*", methods: [ :post, :put ], headers: :any, credentials: true
  end
end
