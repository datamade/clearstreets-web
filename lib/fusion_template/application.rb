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

    FusionTableId = "129O2iei3jOpvTT_yG2xjHjY2hvunTb4IzTHBj_A"

    # redirects for old site
    get "/2012*" do
      redirect "/?1"
    end

    get "/about.html" do
      redirect "/about"
    end

    get "/past-storms.html" do
      redirect "/?2"
    end
    
    # primary routes
    get "/" do
      cache_control :public, max_age: 1800  # 30 min
      @current_menu = "home"
      haml :index
    end

    get "/plows/:id" do
      cache_control :public, max_age: 1800  # 30 min
      @plow = FT.execute("SELECT * FROM #{FusionTableId} WHERE 'Plow ID' = '#{params[:id]}'").first
      haml :plow_detail
    end

    get "/plows/?" do
      cache_control :public, max_age: 900  # 15 min
      @plows = FT.execute("SELECT 'Plow ID', Count() FROM #{FusionTableId} GROUP BY 'Plow ID' ORDER BY Count() DESC")
      haml :plows
    end

    get "/about" do
      cache_control :public, max_age: 1800  # 30 min
      @current_menu = "about"
      haml :about
    end
    
    # catchall for static pages
    get "/:page/?" do
      begin 
        @current_menu = params[:page]
        @title = params[:page].capitalize.gsub(/[_-]/, " ") + " - ClearStreets"
        @page_path = params[:page]
        haml params[:page].to_sym
      rescue Errno::ENOENT
        haml :not_found
      end
    end

    error do
      'Sorry there was a nasty error - ' + env['sinatra.error'].name
    end
  end
end
