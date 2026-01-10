Rails.application.routes.draw do
  root "sandbox#show"
  resources :posts, :people, :groups
  get "sandbox", to: "sandbox#show"
  resources :demo_contents, only: :show

  # Host-constrained direct uploads route
  resources "authenticated_direct_uploads",
    only: [ :create, :update ],
    subdomain: LexxyApp.authenticated_storage_subdomain

  mount Lexxy::Engine => "/lexxy"
end
