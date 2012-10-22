require "sinatra/base"
require "sinatra/reloader"
require "sinatra-initializers"
require "sinatra/r18n"

module FusionTemplate
  class Application < Sinatra::Base
    enable :logging, :sessions
    enable :dump_errors, :show_exceptions if development?

    configure :development do
      register Sinatra::Reloader
    end
    
    register Sinatra::Initializers
    register Sinatra::R18n

    before do
      session[:locale] = params[:locale] if params[:locale]
    end

    use Rack::Logger
    use Rack::Session::Cookie

    helpers FusionTemplate::HtmlHelpers
    
    get "/" do
      @current_menu = "home"
      haml :index
    end

    # note: the fusion_tables gem can only access tables based on the numeric ID of the table
    get "/location_list" do
      @current_menu = "location_list"
      if defined? FT
        # note: the fusion_tables gem can only access tables based on the numeric ID of the table
        @recycling_locations = FT.execute("SELECT * FROM 2086698;")
        haml :location_list
      else
        "fusion_tables gem not setup yet! You need to set your Google account and password in config/config.yml"
      end
    end
    
    get "/:page" do
      @current_menu = params[:page]
      haml params[:page].to_sym
    end
  end
end
