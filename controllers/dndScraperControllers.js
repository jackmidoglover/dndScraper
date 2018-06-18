const cheerio = require("cheerio");
const request = require("request");
const express = require('express');
const router = express.Router();
const axios = require("axios");
const db = require("../models");
const phantom = require("phantom");


//dnd beyond scraper and filter
router.get("/dndbeyondscrape", function (req, res) {
    console.log("dnd beyond scrape hit");
    axios.get("https://www.dndbeyond.com/posts").then(function (response) {
        var $ = cheerio.load(response.data);
        var dummyArray = [];
        $("article").each(function(i, element){
            var result= {};
            result.site = "D&D Beyond";
            result.url = $(this)
                .children("meta").attr("content");
            result.image = $(this)
                .children().find(".post-excerpt__preview-link").attr("style").split("(")[1].split("\n")[0]; 
            result.headline = $(this)
                .find(".post-excerpt__title").children("a").text().trim();
            result.byline = $(this)
                .children().find(".post-excerpt__author").children("a").attr("href").split("/")[2];
            result.summary = $(this)
                .children().find(".post-excerpt__description").children("p").text();
            result.published = $(this)
                .children().find(".post-excerpt__published").children("time").children("abbr").text();
            dummyArray.push(result);
        db.Article.create(result)
            .then(function(newArticle){
                
            }).catch(function(err){
                console.log("Couldn't create new articles");
            })
        });
        res.redirect("/");
    });
});

//dnd beyond filter
router.get("/dndbeyond", function(req, res){
    db.Article.find({ site: "D&D Beyond"}, function(err, docs){
        if (err){console.log(err)};
        let dndInfo = {
            posts: docs
        };
        res.render("index", dndInfo);
    });
})

//dnd wizard scraper
router.get("/wotcscrape", function(req, res){
    console.log("wotc scrape hit");
    axios.get("http://dnd.wizards.com/articles").then(function (response) {
        var $ = cheerio.load(response.data);
        var dummyArray = [];
        $(".article-preview").each(function(i, element){
            var result = {};
            var url = "http://dnd.wizards.com";

            result.site = "Wizards";
            result.url = url + $(this)
                .find(".actions").children("a").attr("href");
            result.image = $(this)
                .find(".image").children("img").attr("src");
            result.headline = $(this)
                .find(".text").children("h4").children("a").text().trim();
            result.summary = $(this)
                .find(".summary").children("p").text().trim();
            result.published = $(this)
                .find(".category").children("a").text().trim();
        db.Article.create(result)
            .then(function(newArticle){
                console.log("new articles created");
            });
        });
    });
    res.redirect("/");
    });

// wizards filter
router.get("/wizards", function(req, res){
    db.Article.find({ site: "Wizards"}, function(err, docs){
        if (err){console.log(err)};
        let wizInfo = {
            posts: docs
        };
        res.render("index", wizInfo);
    });
})

// main page / all articles
router.get("/", function(req, res){
    console.log("index hit");
    db.Article.find({}, function(err, docs){
        let handleInfo = {
            posts: docs
        };
        res.render("index", handleInfo);
    });
});

// route to go to comments page for article
router.get("/comments/:id", function(req, res){
    let id = req.params.id;
    console.log("comments hit", id);
    db.Article.find({_id: id}).populate("comments").then(function(docs){
        return docs;
        console.log(docs);
    }).then(function(data){
        let commentData = {
            comment: data
        };
        console.log(commentData);
        res.render("comments", commentData);
    })
    
});

//route to add comments

router.post("/addComment/:id", function(req, res){
    console.log("add comment hit");
    db.Comments.create(req.body).then(docs =>{
        console.log(docs);
        return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {comments: docs._id} }, {new: true, upsert: true});
    }).then(newArticle => {
        console.log(newArticle);
        res.redirect("/comments/" + req.params.id);
    })
});


module.exports = router;