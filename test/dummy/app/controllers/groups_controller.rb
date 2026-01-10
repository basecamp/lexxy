class GroupsController < ApplicationController
  def index
    @groups = Person.all.each_slice(5)

    render layout: false
  end
end
