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

const client = new Speech.SpeechClient({keyFilename: 'cred.json'});

let textRecognized = '';

const recognizeStream = client
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', data => {
    if (data.results && data.results[0]) {
      //console.log(data.results[0]);
      if(data.results[0].isFinal){
        console.log(data.results[0].alternatives[0].transcript)
        textWriter.write(data.results[0].alternatives[0].transcript + '\n')
        // textRecognized += data.results[0].alternatives[0].transcript + '\n';
      }
    }
});

let textWriter = fs.createWriteStream('demo.txt');

binaryServer.on('connection', function(client) {
  console.log('new connection');

  // var fileWriter = new wav.FileWriter(outFile, {
  //   channels: 1,
  //   sampleRate: 48000,
  //   bitDepth: 16
  // });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    stream.pipe(recognizeStream);
    // stream.pipe(fileWriter);

    stream.on('end', function() {
      //fileWriter.end();
      // console.log('wrote to file ' + outFile);
      // client.emit('message', textRecognized)
      textWriter.end();
      const textReader = fs.createReadStream('demo.txt');
      client.send(textReader);
    });
  });
});


server.listen(9000);
console.log('HTTP and BinaryJS server started on port 9000');