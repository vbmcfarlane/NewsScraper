const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
// Requiring our Note and Article models
const Note = require('./models/Note.js');
const Article = require('./models/Article.js');
// Our scraping tools
const request = require('request');
const cheerio = require('cheerio');
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

const PORT = process.env.PORT || 8080;

// Initialize Express
const app = express();

// Use morgan and body parser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Serve static content
app.use(express.static('public'));

// Set Handlebars.
const exphbs = require('express-handlebars');

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Import routes and give the server access to them.
const routes = require('./controllers/controller.js');

app.use('/', routes);
// Connect to localhost if not a production environment
if(process.env.NODE_ENV == 'production'){
	mongoose.connect('mongodb://heroku_b9bs9537:iTswssyq8gDxG2OPOymy2L3Zvsvw5b2u@ds113566.mlab.com:13566/heroku_b9bs9537');
}
else{
		  mongoose.connect('mongodb://localhost/NYTScraper', {
		  useMongoClient: true
		});
}

const db = mongoose.connection;

// Show any mongoose errors
db.on('error', function(error) {
  console.log(`Mongoose connection unsuccessful.: ${error}`);
});

// Once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

// Listen on port 8080
app.listen(PORT, function() {
  console.log(`App running on PORT:  ${PORT}`);
});