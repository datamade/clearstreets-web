# ClearStreets

ClearStreets tracks Chicago's snow plows in real time by scraping data from the City of Chicago's Plow Tracker. By knowing where the plows are, we've figured out which streets have been plowed.

## Installation

  $ git clone git@github.com:datamade/clearstreets-web.git
  $ cd clearstreets-web
  $ gem install bundler
  $ bundle
  $ unicorn
  navigate to http://localhost:8080/

## Deploy to Heroku
  
Heroku is a cloud hosting platform that can host small Ruby apps (among others) for free. Deploying is built on top of git, so it helps to be familiar with those commands. More info: https://devcenter.heroku.com/articles/git

  $ heroku create name-of-your-app
  make sure all of your changes are committed
  $ git push heroku master

## Dependencies

* [Ruby 1.9.3](http://www.ruby-lang.org/en/downloads)
* [Sinatra](http://www.sinatrarb.com)
* [Haml](http://haml.info)
* [CartoDB](http://cartodb.com)
* [Heroku](http://www.heroku.com)
* [Bootstrap](http://twitter.github.com/bootstrap)
* [Google Analytics](http://www.google.com/analytics)


## Errors / Bugs

If something is not behaving intuitively, it is a bug, and should be reported.
Report it here: https://github.com/datamade/clearstreets-web/issues


## Note on Patches/Pull Requests
 
* Fork the project.
* Make your feature addition or bug fix.
* Commit and send me a pull request. Bonus points for topic branches.

## Copyright

Copyright (c) 2015 Derek Eder, Forest Gregg and Juan-Pablo Velez. Released under the MIT License.

See LICENSE for details https://github.com/datamade/clearstreets-web/blob/master/LICENSE
