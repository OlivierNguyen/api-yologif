const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const _ = require("lodash");
const PORT = process.env.PORT || 5000;
const GIPHY_API_KEY = "LIfYQva4FvbRqRNpR7sI8wleRxv5azMn";

const app = express();

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
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"));

app.use(bodyParser.json());

app.post("/", (req, res) => {
  const entitiesGenre = _.get(req.body, ["nlp", "entities", "genre"], {});
  const mostConfidenteGenre = _.sortBy(entitiesGenre, genre => -genre.confidence);

  console.log("TAG ---> ", mostConfidenteGenre);

  if (!_.isEmpty(mostConfidenteGenre)) {
    searchGiphy(mostConfidenteGenre).then(response => {
      const data = response.data || {};

      res.send({
        replies: [
          {
            type: "picture",
            content: data.data.image_url
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
