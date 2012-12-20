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
      cache_control :public, max_age: 3600  # 1 hour
      @current_menu = "home"
      haml :index
    end

    # note: the fusion_tables gem can only access tables based on the numeric ID of the table
    get "/plows" do
      cache_control :public, max_age: 3600  # 1 hour
      @plows = FT.execute("SELECT 'Plow ID', Count() FROM 129O2iei3jOpvTT_yG2xjHjY2hvunTb4IzTHBj_A GROUP BY 'Plow ID' ORDER BY Count() DESC")
      haml :plows
    end

    get "/about" do
      cache_control :public, max_age: 3600  # 1 hour
      @current_menu = "about"
      haml :about
    end
    
    get "/:page" do
      @current_menu = params[:page]
      haml params[:page].to_sym
    end
  end
end
