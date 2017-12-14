const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const _ = require("lodash");
const PORT = process.env.PORT || 5000;
const GIPHY_API_KEY = "LIfYQva4FvbRqRNpR7sI8wleRxv5azMn";

const app = express();

/**
 * Function which return a promise searching a gif using Giphy API endpoint
 * @param {*} search 
 */
const searchGiphy = search => {
  return axios.get("http://api.giphy.com/v1/gifs/random", {
    params: {
      api_key: GIPHY_API_KEY,
      tag: search
    }
  });
};

app
  .use(express.static(path.join(__dirname, "public")))
  .use(bodyParser.json())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"));

app.post("/api/gif/search", (req, res) => {
  const entitiesGenre = _.get(req.body, ["nlp", "entities", "genre"], {});
  const mostConfidenteGenre = _.first(
    _.sortBy(entitiesGenre, genre => -genre.confidence)
  );
  const tag = mostConfidenteGenre.raw;
  console.log("TAG --->", tag);
  if (tag) {
    searchGiphy(tag).then(response => {
      const data = response.data || {};
      const isEmpty = _.isEmpty(data.data);
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

app.post("/errors", (req, res) => {
  console.log(req.body);
  res.send();
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
