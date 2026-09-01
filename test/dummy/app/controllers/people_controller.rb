class PeopleController < ApplicationController
  def index
    sleep params[:delay].to_f if params[:delay].present?

    @people = Person.all

    if params[:filter].present?
      @people = @people.where("name LIKE ?", "%#{params[:filter]}%")
    end

    render layout: false
  end
end
