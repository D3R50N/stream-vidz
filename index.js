const express = require("express");
const bodyParser = require("body-parser");
const { extname, resolve } = require("path");
const { createReadStream,statSync } = require("fs");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(async (req, res, next) => {
  const isApiVideo = req.url.startsWith("/api/video");
  const hasVideoName = req.query.video;
  const isGoodFormat =
    hasVideoName && req.query.video.match(/^[a-z0-9-_]*\.mp4*$/i);

  if (!isApiVideo || !isGoodFormat) {
    return next();
  }

  const video = resolve("videos", req.query.video);
  // console.log("Video requested: " + video);

  const range = req.headers.range;
  if (!range) {
     res.type(extname(video));
    createReadStream(video).pipe(res);
    return res.end();
  }

   await new Promise((resolve) => setTimeout(resolve, 1000));

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);

  const vstats =  statSync(video);
  var end = parts[1] ? parseInt(parts[1], 10) : vstats.size - 1;

  end = Math.min(end, start + 40000);

  // const end = start + 1000;

  res.set('Content-Range', `bytes ${start}-${end}/${vstats.size}`);
  res.set('Accept-Ranges', 'bytes');
  res.set('Content-Length', end - start + 1);
  res.status(206);
  createReadStream(video, { start, end }).pipe(res);

  console.log("Range: " + start + " - " + end);  
 
  // return next();  
});

app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});
