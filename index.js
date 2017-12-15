const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const R = require("ramda");
const SpotifyWebApi = require("spotify-web-api-node");

const PORT = process.env.PORT || 5000;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

/**
 * Spotify config
 */
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Retrieve an access token.
const getAccessToken = () =>
  spotifyApi.clientCredentialsGrant().then(
    data => {
      console.log("The access token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    err => {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );

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
const getMemoryValue = (body, typeEntity) =>
  R.compose(
    R.propOr(null, "raw"),
    R.pathOr([], ["conversation", "memory", typeEntity])
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
  const tag = getMemoryValue(req.body, "genre");
  console.log("Tag -> ", tag);
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
  const tag = getMemoryValue(req.body, "genre");
  const numberOfGif = getEntityValue(req.body, "number");
  console.log("Tag && Number-> ", tag, numberOfGif);

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

/**
 * SPOTIFY ROUTE
 */

/**
 * POST /api/music/search
 */

app.post("/api/music/search/top", (req, res) => {
  getAccessToken().then(() => {
    const artist =
    getMemoryValue(req.body, "person") || getMemoryValue(req.body, "artist");
    const formattedArtist = artist.toLowerCase();

    spotifyApi
      .searchArtists(formattedArtist)
      .then(data => {
        const artists = data.body.artists.items;
        if (R.isEmpty(artists)) {
          return res.send({
            type: "text",
            content: formattedArtist + " is not found :("
          });
        }
        const artist = R.head(data.body.artists.items);
        console.log("Artist found: ", artist);
        return {
          id: artist.id,
          name: artist.name
        };
      })
      .then(({ id, name }) =>
        spotifyApi
          .getArtistTopTracks(id, "GB")
          .then(data =>
            R.map(track => ({
              ...R.pick(["id", "name"])(track),
              artist: name
            }))(data.body.tracks)
          )
      )
      .then(data =>
        res.send({
          replies: R.map(track => ({
            type: "text",
            content: track.artist + " - " + track.name
          }))(data)
        })
      );
  });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
