Rails.application.routes.draw do
  root "sandbox#show"
  resources :posts, :people
  get "sandbox", to: "sandbox#show"
  resources :demo_contents, only: :show
  mount Lexxy::Engine => "/lexxy"
end
