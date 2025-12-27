Rails.application.routes.draw do
  root "sandbox#show"
  resources :posts, :people, :secrets
  get "sandbox", to: "sandbox#show"
  mount Lexxy::Engine => "/lexxy"
end
