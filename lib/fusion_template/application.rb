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

    Past_storms = [
      {:title => 'Jan 12, 2019', :backup_folder => '01-18-2019', :snowfall => '4"', :notes => '', :show_gpx => true},
      {:title => 'Nov 25-26, 2018', :backup_folder => '12-02-2018', :snowfall => '9"', :notes => '', :show_gpx => true},
      {:title => 'Feb 17, 2018', :backup_folder => '02-18-2018', :snowfall => '2"', :notes => '', :show_gpx => true},
      {:title => 'Feb 8-11, 2018', :backup_folder => '02-13-2018', :snowfall => '14.3"', :notes => '', :show_gpx => true},
      {:title => 'Feb 3-7, 2018', :backup_folder => '02-08-2018', :snowfall => '4"', :notes => '', :show_gpx => true},
      {:title => 'Jan 14-16, 2018', :backup_folder => '02-03-2018', :snowfall => '3-7"', :notes => '', :show_gpx => true},
      {:title => 'Dec 28-29, 2017', :backup_folder => '01-07-2018', :snowfall => '3"', :notes => '', :show_gpx => true},
      {:title => 'Dec 9-11, 2017', :backup_folder => '12-24-2017', :snowfall => '2"', :notes => '', :show_gpx => true},
      {:title => 'Nov 9-11, 2017', :backup_folder => '11-13-2017', :snowfall => '<1"', :notes => '', :show_gpx => true},
      {:title => 'Mar 12-14, 2017', :backup_folder => '04-07-2017', :snowfall => '4"', :notes => '', :show_gpx => true},
      {:title => 'Dec 10-13, 2016', :backup_folder => '12-16-2016', :snowfall => '3"', :notes => '', :show_gpx => true},
      {:title => 'Jan 9, 2016', :backup_folder => '01-11-2016', :snowfall => '1.7"', :notes => '', :show_gpx => true},
      {:title => 'Jan 4, 2016', :backup_folder => '01-05-2016', :snowfall => 'Trace', :notes => '', :show_gpx => true},
      {:title => 'Dec 30, 2015', :backup_folder => '01-02-2016', :snowfall => '1"', :notes => '', :show_gpx => true},
      {:title => 'Dec 28, 2015', :backup_folder => '12-29-2015', :snowfall => '2"', :notes => '', :show_gpx => true},
      {:title => 'Dec 2, 2015', :backup_folder => '12-03-2015', :snowfall => '1"', :notes => '', :show_gpx => true},
      {:title => 'Nov 20-22, 2015', :backup_folder => '11-22-2015', :snowfall => '4-12"', :notes => '', :show_gpx => true},
      {:title => 'Mar 23, 2015', :backup_folder => '03-23-2015', :snowfall => '5"', :notes => '', :show_gpx => true},
      {:title => 'Feb 25-26, 2015', :backup_folder => '02-27-2015', :snowfall => '5.7"', :notes => ''},
      {:title => 'Jan 31 - Feb 8, 2015', :backup_folder => '02-08-2015', :snowfall => '19.3"', :notes => "This was Chicago's 5th largest snow storm on record. Plows were tracked for 9 days and we collected 1.94 million GPS observations of Chicago snow plows. Missing data from 10pm Feb 2nd to 8am Feb 3rd."},
      {:title => 'Jan 26, 2015', :backup_folder => '01-27-2015', :snowfall => '1.0"', :notes => ''},
      {:title => 'Jan 25, 2015', :backup_folder => '01-25-2015', :snowfall => '1.0"', :notes => ''},
      {:title => 'Jan 11-12, 2015', :backup_folder => '01-13-2015', :snowfall => '3.0"', :notes => ''},
      {:title => 'Jan 8, 2015', :backup_folder => '01-09-2015', :snowfall => '3.0"', :notes => ''},
      {:title => 'Jan 5, 2015', :backup_folder => '01-06-2015', :snowfall => '1.8"', :notes => ''},
      {:title => 'Jan 4, 2015', :backup_folder => '01-05-2015', :snowfall => '2.2"', :notes => ''},
      {:title => 'Mar 12, 2014', :backup_folder => '03-13-2014', :snowfall => '3.2"', :notes => ''},
      {:title => 'Mar 1-5, 2014', :backup_folder => '03-11-2014', :snowfall => '3.7"', :notes => 'Missing first 18 hours of data'},
      {:title => 'Feb 17, 2014', :backup_folder => '02-19-2014', :snowfall => '5"', :notes => 'Missing last 10 hours of data'},
      {:title => 'Feb 8, 2014', :backup_folder => '02-10-2014', :snowfall => '2.5"'},
      {:title => 'Feb 4-5, 2014', :backup_folder => '02-07-2014', :snowfall => '7.1"'},
      {:title => 'Jan 31 - Feb 2, 2014', :backup_folder => '02-04-2014', :snowfall => '4"'},
      {:title => 'Jan 24-26, 2014', :backup_folder => '01-27-2014', :snowfall => '2.8"'},
      {:title => 'Jan 21-23, 2014', :backup_folder => '01-24-2014', :snowfall => '3.1"'},
      {:title => 'Jan 18, 2014', :backup_folder => '01-20-2014', :snowfall => '2.4"', :notes => 'Missing first 8 hours of data'},
      {:title => 'Jan 4-10, 2014', :backup_folder => '01-10-2014', :snowfall => '12"', :notes => 'Missing data from Jan 7-8 due to unforseen City data feed changes'},
      {:carto_db_url => 'http://clearstreets.cartodb.com/tables/9446/public/map', :title => 'Dec 25, 2013', :backup_folder => '12-27-2013', :snowfall => '1.2"'},
      {:carto_db_url => 'http://clearstreets.cartodb.com/tables/9215/public/map', :title => 'Dec 22, 2013', :backup_folder => '12-25-2013', :snowfall => '2"'},
      {:carto_db_url => 'http://clearstreets.cartodb.com/tables/8961/public/map', :title => 'Dec 17, 2013', :backup_folder => '12-19-2013', :snowfall => '1"'},
      {:carto_db_url => 'http://clearstreets.cartodb.com/tables/7862/public/map', :title => 'Dec 16, 2013', :backup_folder => '12-17-2013', :snowfall => '2"'},
      {:carto_db_url => 'http://clearstreets.cartodb.com/tables/7348/public/map', :title => 'Dec 13-14, 2013', :backup_folder => '12-16-2013', :snowfall => '4.2"'},
      {:fusion_table_id => '129O2iei3jOpvTT_yG2xjHjY2hvunTb4IzTHBj_A', :title => 'Dec 10-11, 2013', :type => '', :backup_folder => '12-11-2013', :snowfall => '0.9"'},
      {:fusion_table_id => '1dOMXfBMwQeYA8hQ2aWgK7ey6rRX4pebXmVB2pIM', :title => 'Dec 8, 2013', :type => '', :backup_folder => '12-10-2013', :snowfall => '3.1"'},
      {:fusion_table_id => '1RIRVDtmgZxBet1Hd9kJi6GLdvl9dC45SrtzsAko', :title => 'Mar 5, 2013', :type => '', :backup_folder => '03-06-2013', :snowfall => '9.2"'},
      {:fusion_table_id => '1yYkZlNtZHFfAZ4vdOi2jTvIDV4hdkd2XmoicJ9U', :title => 'Feb 26-27, 2013', :type => '', :backup_folder => '02-27-2013', :snowfall => '1"'},
      {:fusion_table_id => '1o5iP9qK0YnCcuqIQ8G3KkgA8qGQEaI8HrxlXKbs', :title => 'Feb 22, 2013', :type => '', :backup_folder => '02-22-2013', :snowfall => '1.9"'},
      {:fusion_table_id => '1fBpR7sN8avSbL1Zc0Ye8rs7Qkww-4raKLm0WrwM', :title => 'Feb 7, 2013', :type => '', :backup_folder => '', :snowfall => '1.4"'},
      {:fusion_table_id => '1ejPv2ivummsG1Qgn6tW1molfZul-nUHdqbdLduc', :title => 'Feb 4, 2013', :type => '', :backup_folder => '02-05-2013', :snowfall => '2.4"'},
      {:fusion_table_id => '1hYWSY3i91n8lUnCI9i2CfK1TVp2UFgx9IVjLmbo', :title => 'Feb 2, 2013', :type => '', :backup_folder => '02-03-2013', :snowfall => '1.8"'},
      {:fusion_table_id => '1NKzNt2E0ScHUs9OIM22UAmh1pQZl7geWqH1fSyg', :title => 'Jan 25-28, 2013', :type => '', :backup_folder => '01-31-2013', :snowfall => '1.1"'},
      {:fusion_table_id => '12vrI6yT7pIKFqRLPDs2BiRNdH3Y0DXzyNEISSeg', :title => 'Dec 20, 2012', :type => '', :backup_folder => '12-20-2012', :snowfall => '0.3"'},
      {:fusion_table_id => '1Joj30eltDiXAhbhizuurstPUfqYeSISEmlOANHE', :title => 'Feb 10, 2012', :type => 'legacy', :backup_folder => '', :snowfall => '1.5"'},
      {:fusion_table_id => '18LV9PXFVzgP_eZhBRcbsCWRW9sHTMLPaxx3lDa8', :title => 'Jan 21, 2012 (part 2)', :type => 'legacy', :backup_folder => ''},
      {:fusion_table_id => '1hq3bK1dUqyE6LCQ488tZF3syQQc5jYsluMS5Fy0', :title => 'Jan 21, 2012 (part 1)', :type => 'legacy', :backup_folder => '', :snowfall => '9"', :notes => 'Split in to two Fusion Tables.'}
    ]

    # redirects for old site
    get "/2012*" do
      redirect "/?1"
    end

    get "/history" do
      redirect "/data"
    end

    get "/about.html" do
      redirect "/about"
    end

    get "/past-storms.html" do
      redirect "/?2"
    end

    # utility for flushing cache
    get "/flush_cache" do
      require 'dalli'
      dc = Dalli::Client.new
      dc.flush
      redirect "/"
    end
    
    # primary routes
    get "/" do
      cache_control :public, max_age: 1800  # 30 min
      @current_menu = "home"
      haml :index
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
