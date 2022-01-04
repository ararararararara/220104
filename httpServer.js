const express = require("express");
const bodyParser = require("body-parser");
const { getVersion, getBlocks } = require("./chainedBlock.js");
const { Blocks, addBlock, nextBlock } = require("./checkVaildBlock");
// const publicKey = keys.publicKey;

const http_port = process.env.HTTP_PORT || 3001;

function initHttpServer() {
  const app = express();
  app.use(bodyParser.json());

  app.get("/blocks", (req, res) => {
    res.send(getBlock());
  });

  app.post("/mineBlock", (req, res) => {
    const data = req.body.data || [];
    const block = nextBlock(data);
    addBlock(block);

    res.send(block);
  });

  app.get("/version", (req, res) => {
    res.send(getVersion());
  });
  app.post("/stop", (req, res) => {
    res.send({ msg: "Stop Server!" });
    process.exit();
  });
  ////////지갑가져오는 주소추가
  app.get("/address", (req, res) => {
    const address = getPublicKeyFromWallet();
    if (address != "") {
      res.send({ address: address });
    } else {
      res.send("empty address!");
    }
  });
  //app.get('/address',(req,res)=>{
  //	const address = wl.getPublicFromWallet();
  //	res.send({"adress:": address })
  //});

  app.listen(http_port, () => {
    console.log("Listening Http Port : " + http_port);
  });
}
initHttpServer();
