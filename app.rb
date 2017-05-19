require 'sinatra'
require 'json'

get '/' do
  File.read('views/index.html')
end

get '/favorites' do
  response.header['Content-Type'] = 'application/json'
  File.read('data.json')
end

post '/favorites' do
  file = File.zero?('data.json') ? [] : JSON.parse(File.read('data.json'))
  movie = JSON.parse(request.body.read)
  file << movie
  File.write('data.json', JSON.pretty_generate(file))
  movie.to_json
end
