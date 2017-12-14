const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const R = require("ramda");
const PORT = process.env.PORT || 5000;
const GIPHY_API_KEY = "LIfYQva4FvbRqRNpR7sI8wleRxv5azMn";

const app = express();

/**
 * Function which return a promise searching a gif using Giphy API endpoint
 * @param {*} search
 * return Promise
 */
const searchGiphy = search => {
  return axios.get("http://api.giphy.com/v1/gifs/random", {
    params: {
      api_key: GIPHY_API_KEY,
      tag: search
    }
  });
};

/**
 * Function which extracts a tag ("genre" entities) from the Recast.ai body answer
 * @param body: {messages: [], conversation: {}, nlp: { entities: { genre: [...]}}}
 * @param typeEntity: Type of entity (number, genre, verb...)
 * return String
 */
const getEntityValue = (body, typeEntity) =>
  R.compose(
    R.propOr(null, "raw"),
    R.last,
    R.sortBy(R.prop("confidence")),
    R.pathOr([], ["nlp", "entities", typeEntity])
  )(body);

app
  .use(express.static(path.join(__dirname, "public")))
  .use(bodyParser.json())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"));

app.post("/api/gif/search", (req, res) => {
  const tag = getEntityValue(req.body, "genre");

  console.log("TAG --->", tag);
  if (tag) {
    searchGiphy(tag).then(response => {
      const data = response.data || {};
      const isEmpty = R.isEmpty(data.data);
      res.send({
        replies: [
          {
            type: isEmpty ? "text" : "picture",
            content: isEmpty ? "GIF not found :(" : data.data.image_url
          }
        ]
      });
    });
  } else {
    res.send({
      replies: [
        {
          type: "text",
          content: "GIF not found :("
        }
      ]
    });
  }
});

app.post("/api/gif/multiple", (req, res) => {
  const tag = getEntityValue(req.body, "genre");
  const numberOfGif = getEntityValue(req.body, "number");

  console.log("TAG MULTIPLE --->", tag);
  console.log("numberOfGif", numberOfGif);

  if (tag && numberOfGif > 0) {
    const promises = R.map(i => searchGiphy(tag))(
      R.times(R.identity)(numberOfGif)
    );

    Promise.all(promises).then(values => {
      return res.send({
        replies: R.map(value => ({
          type: "picture",
          content: value.data.image_url
        }))(values)
      });
    });
  } else {
    res.send({
      replies: [
        {
          type: "text",
          content: "GIF not found :("
        }
      ]
    });
  }
});

app.post("/errors", (req, res) => {
  console.log(req.body);
  res.send();
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
