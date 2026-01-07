Rails.application.routes.draw do
  root "sandbox#show"
  resources :posts, :people
  get "sandbox", to: "sandbox#show"
  get "sandbox/load_content/:partial", to: "sandbox#load_content", as: "sandbox_load_content"
  mount Lexxy::Engine => "/lexxy"
end
