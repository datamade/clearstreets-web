require "bundler"
Bundler.require :default

base = File.dirname(__FILE__)
$:.unshift File.join(base, "lib")

require "fusion_template"

Sinatra::Base.set(:root) { base }
run FusionTemplate::Application
