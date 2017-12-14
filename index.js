const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const R = require("ramda");
const PORT = process.env.PORT || 5000;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

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

/**
 * Configure routes
 */
const app = express();

app
  .use(express.static(path.join(__dirname, "public")))
  .use(bodyParser.json())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"));

/**
 * POST /api/gif/search
 */
app.post("/api/gif/search", (req, res) => {
  const tag = getEntityValue(req.body, "genre");

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

/**
 * POST /api/gif/multiple
 */
app.post("/api/gif/multiple", (req, res) => {
  const tag = getEntityValue(req.body, "genre");
  const numberOfGif = getEntityValue(req.body, "number");

  if (tag && numberOfGif > 0) {
    const promises = R.map(i => searchGiphy(tag))(
      R.times(R.identity)(numberOfGif)
    );

    Promise.all(promises).then(values => {
      return res.send({
        replies: R.map(value => ({
          type: "picture",
          content: value.data.data.image_url
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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
