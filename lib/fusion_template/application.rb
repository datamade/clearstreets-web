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

    Fusion_tables = [
      {:id => '129O2iei3jOpvTT_yG2xjHjY2hvunTb4IzTHBj_A', :title => 'Feb 7, 2013 (Live!)', :type => ''},
      {:id => '1ejPv2ivummsG1Qgn6tW1molfZul-nUHdqbdLduc', :title => 'Feb 4, 2013', :type => ''},
      {:id => '1hYWSY3i91n8lUnCI9i2CfK1TVp2UFgx9IVjLmbo', :title => 'Feb 2, 2013', :type => ''},
      {:id => '1NKzNt2E0ScHUs9OIM22UAmh1pQZl7geWqH1fSyg', :title => 'Jan 25-28, 2013', :type => ''},
      {:id => '12vrI6yT7pIKFqRLPDs2BiRNdH3Y0DXzyNEISSeg', :title => 'Dec 20, 2012', :type => ''},
      {:id => '1Joj30eltDiXAhbhizuurstPUfqYeSISEmlOANHE', :title => 'Feb 10, 2012', :type => 'legacy'},
      {:id => '18LV9PXFVzgP_eZhBRcbsCWRW9sHTMLPaxx3lDa8', :title => 'Jan 21, 2012 (part 2)', :type => 'legacy'},
      {:id => '1hq3bK1dUqyE6LCQ488tZF3syQQc5jYsluMS5Fy0', :title => 'Jan 21, 2012 (part 1)', :type => 'legacy'}
    ]

    Current_fusion_table_id = Fusion_tables.first[:id]

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

    # utility for flushing cache
    get "/flush_cache" do
      if memcache_servers = ENV["MEMCACHE_SERVERS"]
        require 'dalli'
        dc = Dalli::Client.new
        dc.flush
      end
      redirect "/"
    end
    
    # primary routes
    get "/" do
      cache_control :public, max_age: 1800  # 30 min
      @current_menu = "home"
      haml :index
    end

    get "/plows/:id" do
      cache_control :public, max_age: 1800  # 30 min
      @plow = FT.execute("SELECT * FROM #{Current_fusion_table_id} WHERE 'Plow ID' = '#{params[:id]}'").first
      haml :plow_detail
    end

    get "/plows/?" do
      cache_control :public, max_age: 900  # 15 min
      @plows = FT.execute("SELECT 'Plow ID', Count() FROM #{Current_fusion_table_id} GROUP BY 'Plow ID' ORDER BY Count() DESC")
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
