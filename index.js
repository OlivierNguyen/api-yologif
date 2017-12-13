const express = require("express");
const path = require("path");
const axios = require("axios");
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

app.post("/", (req, res) => {
  console.log(req.body);

  searchGiphy("wtf").then(response => {
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
});

app.post("/errors", (req, res) => {
  console.log(req.body);
  res.send();
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
