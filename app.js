var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');
const Speech = require('@google-cloud/speech');
const http = require('http');

var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

const server = http.createServer(app);

binaryServer = BinaryServer({server: server});

const request = {
  config: {
    encoding: 'LINEAR16',
    // sampleRateHertz: 16000,
    sampleRateHertz: 44100,
    languageCode: 'en-US',
    // enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    model: 'default',
  },
  interimResults: true, // If you want interim results, set this to true
  verbose: true,
};

const speechClient = new Speech.SpeechClient({keyFilename: 'cred.json'});

let textRecognized = '';


//let textWriter = fs.createWriteStream('demo.txt');

let clients = {};

binaryServer.on('connection', function(client) {
  console.log('new connection ' + client.id);

  const recognizeStream = speechClient
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', data => {
    if (data.results && data.results[0]) {
      //console.log(data.results[0]);
      if(data.results[0].isFinal){
        console.log(data.results[0].alternatives[0].transcript);
        client.send(data.results[0].alternatives[0].transcript);
      }
    }
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    stream.pipe(recognizeStream);
    // stream.pipe(fileWriter);

    stream.on('end', function() {
      //fileWriter.end();
      // console.log('wrote to file ' + outFile);
      // client.emit('message', textRecognized)
      // textWriter.end();
      client.send('Recording Ended');
    });
  });

  // clients[client.id] = client;
});


server.listen(9000);
console.log('HTTP and BinaryJS server started on port 9000');