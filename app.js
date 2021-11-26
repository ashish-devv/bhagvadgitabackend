require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

const { bgslok, bgchap } = require("./models/bhagavadgita.model");
const { renderSVG, gitaslokid } = require("./lib/bhagavadgita");

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to MONGO DB..."))
  .catch((err) => console.log(err));

//mongoose.set("debug", true);

// GET Random gita Quote
app.get("/gita", (req, res) => {
  //console.log(gitaslokid());
  bgslok.findOne({ _id: gitaslokid() }, (err, data) => {
    if (err) {
      return res.send(err);
    } else {
      //console.log(data);
      return res.send(data);
    }
  });
});

// GET particular slok
app.get("/gita/:ch/:sl", async (req, res) => {
  const chapter = req.params.ch;
  const slok = req.params.sl;
  if (!isNaN(chapter) && !isNaN(slok)) {
    await bgslok.findById(`BG${chapter}.${slok}`, (err, data) => {
      if (!data) {
        return res
          .status(400)
          .json({ error: "This Chapter or Slok does not exist" });
      }
      return res.json(data);
    });
  } else {
    return res
      .status(400)
      .json({ error: "Invalid request, Plese type valid input" });
  }
});

// GET slok svg urls
app.get("/gita.svg", async (req, res) => {
  const chapter = req.query.ch;
  const slok = req.query.sl;
  if (
    (typeof chapter === "undefined" && typeof slok === "undefined") ||
    (!isNaN(chapter) && typeof slok === "undefined") ||
    (!isNaN(chapter) && !isNaN(slok))
  ) {
    await bgslok.findById(gitaslokid(chapter, slok), (err, data) => {
      if (!data) {
        return res
          .status(400)
          .json({ error: "Chapter or Slok does not exist" });
      }
      res.set({
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=600",
      });
      return res.send(renderSVG(data));
    });
  } else {
    return res
      .status(400)
      .json({ error: "Invalid request, Plese type valid input" });
  }
});

// GET all chapters urls
app.get("/gita/chapters", async (req, res) => {
  await bgchap.find(
    {},
    { _id: 0 },
    { sort: { chapter_number: 1 } },
    (err, data) => {
      if (!data) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
      return res.json(data);
    }
  );
});

// GET particular chapters urls
app.get("/gita/:ch", async (req, res) => {
  const chapter = req.params.ch;
  //console.log(typeof chapter);
  if (!isNaN(chapter)) {
    await bgchap.findOne(
      { chapter_number: chapter },
      { _id: 0 },
      (err, data) => {
        //console.log(err);
        if (!data) {
          return res
            .status(400)
            .json({ error: "This Chapter does not exist Try only 1 to 18" });
        }

        return res.json(data);
      }
    );
  } else {
    return res
      .status(400)
      .json({ error: "Invalid request, Plese type valid input" });
  }
});

app.get("/createall", (req, res) => {
  //bgchap.create(bgchap.data, (err, data) => {});
  bgslok.create(bgslok.data, (err, data) => {});
  return res.send("done");
});

// const PORT = process.env.PORT || 80;
const server = app.listen(process.env.PORT || 80, () => {
  console.log("Server Started on port %s...", server.address().port);
});
