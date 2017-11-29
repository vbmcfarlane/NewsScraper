const express = require('express');
const router = express.Router();
const request = require('request');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
console.log('Running ********controller.js********');
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

let Note = require('../models/Note.js');
let Article = require('../models/Article.js');

router.get('/', function(req, res) {
  console.log('Running ********controller Router.get (/ ********');
  res.render('index');
});
//===============================================================================================
// This will get the articles scraped and saved in db and show them in list.
router.get('/savedarticles', function(req, res) {
 console.log('Running ********controller Router.get (/savedarticles ********');
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      let hbsArticleObject = {
        articles: doc
      };
      res.render('savedarticles', hbsArticleObject);
    }
  });
});
//===============================================================================================
// A GET request to scrape the echojs website
router.post('/scrape', function(req, res) {
 console.log(`Running ********controller Router.get ('/scrape')********`); 
  // First, we grab the body of the html with request
  request('http://www.nytimes.com/', function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    let $ = cheerio.load(html);

    // Array of scraped Articles
    let scrapedArticles = {};
    // Now, we grab every h2 within an article tag, and do the following:
    $('article.story').each(function (i, element) {
        let result = {};
        result.title    = $(this).children('h2').text().trim();
        result.byline   = $(this).children('p.byline').text().trim();
        result.summary  = $(this).children('p.summary').text().trim();
        result.link     = $(this).children('h2').children('a').attr('href');
      // if(result.title.trim() !==''){
      if(result.title){
        console.log(`Value of title : ${result.title} `);
      scrapedArticles[i] = result;
      } else{
        console.log(` Title empty skipping to next record`);
      }
    });

    console.log(`Scraped Articles objects:  ${scrapedArticles}`);

    let hbsArticleObject = {
        articles: scrapedArticles
    };

    res.render('index', hbsArticleObject);

  });
});
//=====================================================================================
router.post('/save', function(req, res) {
 console.log(`Running ********controller Router.get ('/save'********`);
  console.log('This is the title: ' + req.body.title);

  let articleObject = {};

  articleObject.title   = req.body.title;
  articleObject.byline  = req.body.byline;
  articleObject.summary = req.body.summary;
  articleObject.link    = req.body.link;

  let entry = new Article(articleObject);

  console.log(`Saving article:  ${entry}`);

  // Now, save that entry to the d
  entry.save(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    }
    // Or log the doc
    else {
      console.log(doc);
    }
  });

  res.redirect('/savedarticles');
});
//=======================================================================================
router.get('/delete/:id', function(req, res) {
  console.log("Running ********controller router.get('/delete/:id*findOneAndRemove*******");
  console.log(`ID selected for deletion :  ${req.params.id}`);

  Article.findOneAndRemove({'_id': req.params.id}, function (err, offer) {
    if (err) {
      console.log(`Error detected : ${err}`);
    } else {
      console.log(`Delete record :  ${req.params.id}`);
    }
    res.redirect('/savedarticles');
  });
});
//=======================================================================================
router.get('/notes/:id', function(req, res) {
  console.log("Running ********controller router.get('/notes/:id*findOneAndRemove*******");
  console.log('ID is getting read for delete' + req.params.id);

  Note.findOneAndRemove({'_id': req.params.id}, function (err, doc) {
    if (err) {
      console.log('Not able to delete:' + err);
    } else {
      console.log('Delete articles' );
    }
    res.send(doc);
  });
});
//========================================================================================
// This will grab an article by it's ObjectId
router.get('/articles/:id', function(req, res) {
  console.log("Running ********controller router.get('/articles/:id'* findOne *******");
  console.log('ID is getting read' + req.params.id);

  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({'_id': req.params.id})

  .populate('notes')

  .exec(function(err, doc) {
    if (err) {
      console.log('Not able to find article and get notes.');
    }
    else {
      console.log(`Article and Notes:  ${doc}`);
      res.json(doc);
    }
  });
});
//========================================================================================
// Create a new note or replace an existing note
router.post('/articles/:id', function(req, res) {
  console.log("Running ********controller post('/articles/:id' * findOne*******");
  // Create a new note and pass the req.body to the entry
  let newNote = new Note(req.body);
  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    } 
    else {
      // Use the article id to find it and then push note
      Article.findOneAndUpdate({ '_id': req.params.id }, 
        {$push: {notes: doc._id}}, 
        {new: true, upsert: true})

      .populate('notes')

      .exec(function (err, doc) {
        if (err) {
          console.log('Cannot find article.');
        } else {
          console.log(` Notes:  ${doc.notes}`);
          res.send(doc);
        }
      });
    }
  });
});
// Export routes for server.js to use.
module.exports = router;