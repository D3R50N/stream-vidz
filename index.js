const express = require("express");
const bodyParser = require("body-parser");
const { extname, resolve } = require("path");
const { createReadStream, statSync, existsSync } = require("fs");
const app = express();

app.use(express.static(__dirname+"/pages"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(resolve("pages","index.html"));
});

app.use(async (req, res, next) => {
  const isApiVideo = req.url.startsWith("/api/video");
  const hasVideoName = req.query.video;
  const isGoodFormat =
    hasVideoName && req.query.video.match(/^[a-z0-9-_]*\.(mp4|avi)*$/i);
  if (!isApiVideo || !isGoodFormat) {
    return next();
  }

  const video = resolve("videos", req.query.video);

  if (!existsSync(video)) {
         return res.status(404).sendFile(resolve("pages", "error.html"));

  }
  const range = req.headers.range;
  if (!range) {
    // res.type(extname(video));
    res.type(".mp4");
    createReadStream(video).pipe(res);
    return res.end();
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);

  const vstats = statSync(video);
  var end = parts[1] ? parseInt(parts[1], 10) : vstats.size - 1;

  // end = Math.min(end, start + ~~(vstats.size / 1000));
  // end -= ~~(vstats.size / 1000);
  // const end = start + 1000;

  res.set("Content-Range", `bytes ${start}-${end}/${vstats.size}`);
  res.set("Accept-Ranges", "bytes");
  res.set("Content-Length", end - start + 1);
  res.status(206);
  createReadStream(video, { start, end }).pipe(res);

  // console.log("Range: " + toSpacedStr(start) + " - " + toSpacedStr(end));
  console.log("..sending packet (", ~~((end - start) / 1024), "ko)");

  // return next();
});

app.use((req, res, next) => {
     return res.status(404).sendFile(resolve("pages", "error.html"));

});
app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});

function toSpacedStr(str) {
  let ret = "";
  let rev = str.toString().split("").reverse();
  let count = 0;
  for (let index = 0; index < rev.length; index++) {
    const element = rev[index];
    ret = element + ret;
    count++;
    if (count >= 3) {
      ret = " " + ret;
      count = 0;
    }
  }

  return ret.replace(" ", "");
}
