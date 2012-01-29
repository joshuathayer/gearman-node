# This is an example worker that the tests use. `gem install gearman` and run
# `gearmand` on localhost:4730 to use it.

require 'rubygems'
require 'gearman'

w = Gearman::Worker.new(['localhost:4730'])

w.add_ability('test') do |data, job|
  puts data
#  sleep 0.25
  job.send_data 'test'
  puts "sent data"
#  sleep 0.25
  job.report_warning 'test'
  puts "sent warning"
#  sleep 0.25
  puts "returning reverse now"
  data.reverse
  
end

w.add_ability('test_fail') do
  sleep 0.25
  false
end

loop { w.work }
