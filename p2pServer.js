const p2p_port = process.env.P2P_PORT || 6001;
const WebSocket = require("ws");
const { addBlock } = require("../sample2/checkVaildBlock");
const { getLastBlock, createHash } = require("./checkVaildBlock");

function initP2PServer() {
  //p2p함수 초기화
  const server = new WebSocket.Server({ port: p2p_port });
  server.on("connection", (ws) => {
    initConnection(ws);
  });
  console.log("Listening webSocket port : " + test_port);
}
initP2PServer(6001);
initP2PServer(6002);
initP2PServer(6003);

let sockets = [];

function initConnection(ws) {
  //연결되는애들만 푸시
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  //write(ws,queryAllMsg())
  //write(ws,queryLatesMsg())
}
function getSockets() {
  return sockets;
}
function write(ws, message) {
  ws.send(JSON.stringify(message));
}
function broadcast(message) {
  sockets.forEach(
    // function (socket){
    // 	write(socket, message);
    // }
    (socket) => {
      write(socket, message);
    }
  );
}
function connectToPeers(newPeers) {
  newPeers.forEach((peer) => {
    const ws = new WebSocket(peer);
    ws.on("open", () => {
      initConnection(ws);
    });
    ws.on("error", () => {
      console.log("connection Failed!");
    });
  });
}

//Message Handler
const MessageType = {
  QUERY_LATEST: 0, //제일마지막꺼요청
  QUERTY_ALL: 1, //
  RESPONSE_BLOCKCHAIN: 2,
};
function initMessageHandler(ws) {
  ws.on("message", (data) => {
    const meessage = JSON.parse(data);
    switch (message.type) {
      case MessageType.QUERY_LATEST:
        write(ws, responseLatestMsg());
        break;
      case MessageType.QUERTY_ALL:
        write(ws, responseAllChainMsg());
        break;
      case MessageType.RESPONSE_BLOCKCHAIN:
        handleBlockChainResponse(message);
        break;
    }
  });
}
function responseLatestMsg() {
  return {
    type: RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(getLastBlock()),
  };
}
function responseLatestMsg() {
  return {
    type: RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(getBlocks()),
  };
}
function handleBlockChainResponse() {
  const receiveBlocks = JSON.parse(message.data);
  const latestReceiveBlock = receiveBlocks[receiveBlocks.length - 1];
  const latesMyBlock = getLastBlock();

  // 데이터로 받은 블럭 중에 마지막 블럭의 인덱스가
  // 내가 보유 중인 마지막 블럭의 인덱스보다 클 때 /작을 때
  if (latestReceiveBlock.header.index > latesMyBlock.header.index) {
    // 받은 마지막 블록의 이전 해시값이 내 마지막 블럭일때
    if (createHash(latesMyBlock) === latestReceiveBlock.header.previousHash) {
      if (addBlock(latestReceiveBlock)) {
        broadcast(responseLatestMsg());
      } else {
        console.log("Invalid Block!!");
      }
    }
    //받은 블럭의 전체 크기가 1일때
    else if (receiveBlocks.length === 1) {
      broadcast(queryAllMsg);
    } else {
      replaceChain(receiveBlocks);
    }
  } else {
    console.log("Do nothing.");
  }
}

function queryAllMsg() {
  return {
    type: QUERTY_ALL,
    data: null,
  };
}

function queryLatestMsg() {
  return {
    type: QUERTY_LATEST,
    data: null,
  };
}

function initErrorHandler(ws) {
  ws.on("close", () => {
    closeConnection(ws);
  });
  ws.on("error", () => {
    closeConnection(ws);
  });
}
function closeConnection(ws) {
  console.log(`Connection close ${ws.url}`);
  sockets.splice(sockets.indexOf(ws), 1); //소켓복사..초기화
}
function replaceChain(newBlocks) {
  if (isValidChain(newBlocks)) {
    //체인문제없는지 확인
    if (
      newBlocks.length > Blocks.length ||
      (newBlocks.length === Blocks.length && random.boolean())
    ) {
      Blocks = newBlocks;
      broadcast(reponseLatestMsg());
    }
  } else {
    console.log("받은 원장에 문제가 있음");
  }
}
module.exports = {
  connectToPeers,
  getSockets,
  broadcast,
  initP2PServer,
};
