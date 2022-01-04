const fs = require("fs"); //json 파일읽으려고
const merkle = require("merkle");
const cryptojs = require("crypto-js");
const random = require("random");
const Block_GNERATION_INTERVAL = 10; //	second 단위 :초 //블럭생성간격
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // in blocks 블럭마다 난위도가 조정되는 간격
//블럭10개만들어질때마다 난위도조정
//기대시간 = 초 * 난위도 (크거나작으면 특정시간을 조정해서 맞춤)

class Block {
  constructor(header, body) {
    this.header = header;
    this.body = body;
  }
}
class BlockHeader {
  constructor(
    version,
    index,
    previousBlockHash,
    merkleRoot,
    timestap,
    difficulty,
    nonce
  ) {
    this.version = version;
    this.index = index;
    this.previousBlockHash = previousBlockHash;
    this.merkleRoot = merkleRoot;
    this.timestap = timestap;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}
function getVersion() {
  const package = fs.readFileSync("package.json");
  //console.log(JSOM.parse(package).version);
  return JSON.parse(package).version;
}
function createGenesisBlock() {
  //최초의 블록 생성
  const version = getVersion();
  const index = 0;
  const previousBlockHash = "0".repeat(64);
  const timestamp = 1231006505; //2009/01/03 6:15pm (UTC)
  const body = [
    "The Times 03/Jan/2009 Chancellor on brink of second bailout for bank",
  ];
  const tree = merkle("sha256").sync(body);
  const merkleRoot = tree.root() || "0".repeat(64);
  const difficulty = 1;
  const nonce = 0;

  const header = new BlockHeader(
    version,
    index,
    previousBlockHash,
    merkleRoot,
    timestamp,
    difficulty,
    nonce
  );

  return new Block(header, body);
}

let Blocks = [createGenesisBlock()];

function getBlocks() {
  return Blocks;
}

function getLastBlock() {
  return Blocks[Blocks.length - 1];
}

function createHash(data) {
  const {
    version,
    index,
    previousBlockHash,
    merkleRoot,
    timestamp,
    difficulty,
    nonce,
  } = data.header;
  const blockString =
    version +
    index +
    previousBlockHash +
    merkleRoot +
    timestamp +
    difficulty +
    nonce;
  const hash = cryptojs.SHA256(blockString).toString(); //위에 blockString 에 담은값을 crypto모듈
  //에서SHA256을 통해 해쉬값으로 바꾼후 이걸 String으로
  return hash; // 반환한다음
}

function calculateHash(
  version,
  index,
  previousBlockHash,
  merkleRoot,
  timestamp,
  difficulty,
  nonce
) {
  const blockString =
    version +
    index +
    previousBlockHash +
    merkleRoot +
    timestamp +
    difficulty +
    nonce;
  const hash = cryptojs.SHA256(blockString).toString(); //위에 blockString 에 담은값을 crypto모듈
  //에서SHA256을 통해 해쉬값으로 바꾼후 이걸 String으로
  return hash; // 반환한다음
}

function nextBlock(bodyData) {
  const prevBlock = getLastBlock(); //getLastBlock : Blocks[Blocks.length - 1] 블록의 마지막 값
  const version = getVersion(); //버전 불러옴
  const index = prevBlock.header.index + 1; //이전 헤더의 인덱스 +1
  const previousBlockHash = createHash(prevBlock); // 이전 블록의 해쉬값
  const timestamp = parseInt(Date.now() / 1000); //시간 1초단위
  const tree = merkle("sha256").sync(bodyData); //bodyData받아온거 해쉬값으로 변환
  const merkleRoot = tree.root() || "0".repeat(); //0을 돌려서
  const difficulty = 0;
  const nonce = 0; //반복한숫자

  const header = findBlock(
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty
  );
  return new Block(header, bodyData); //헤더에 정보 저장 , 헤더랑 바디 블록으로 리턴
}

function addBlock(bodyData) {
  const newBlock = nextBlock(bodyData);
  Blocks.push(newBlock); //새로운 블록을 추가
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
function hexToBinary(s) {
  const lookupTable = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };
  var ret = "";
  for (var i = 0; i < s.length; i++) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    } else {
      return null;
    }
  }
  return ret;
}
function hashMatchesDifficulty(hash, difficulty) {
  const hashBinary = hexToBinary(hash.toUpperCase()); //대문자로 바꾸기
  const requirePrefix = "0".repeat(difficulty);
  return hash.startsWith(requirePrefix);
}

function findBlock(
  currentVersion,
  nextIndex,
  previousHash,
  nextTimestamp,
  merkleRoot,
  difficulty
) {
  var nonce = 0;
  while (true) {
    var hash = calculateHash(
      currentVersion,
      nextIndex,
      previousHash,
      nextTimestamp,
      merkleRoot,
      difficulty,
      nonce
    );
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new BlockHeader(
        currentVersion,
        nextIndex,
        previousHash,
        nextTimestamp,
        merkleRoot,
        difficulty,
        nonce
      );
    }
    nonce++;
  }
}
const genesisBlock = createGenesisBlock();
console.log(genesisBlock); //최초의블록

// const block1 = nextBlock(["transaction1"])
// console.log(block1);

// addBlock(['transaction2'])
// addBlock(['transaction3'])
// addBlock(['transaction4'])
// addBlock(['transaction5'])
// console.log(Blocks);
function getDIfficulty(blocks) {
  const lastBlock = blocks[blocks.length - 1];
  if (
    lastBlock.header.index !== 0 &&
    lastBlock.header.difficulty.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0
  ) {
    return getAdjustDifficulty(lastBlock, blocks);
  }
  return lastBlock.header.difficulty;
}
function getAdjustDifficulty(lastBlock, blocks) {
  const prevAdjustmentBlcok =
    blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const elapsedTime =
    lastBlock.header.timestamp - prevAdjustmentBlcok.header.timestamp; //실제난위도 조정된간격
  const expectedTime =
    Block_GNERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;

  if (expectedTime / 2 > elapsedTime) {
    return prevAdjustmentBlcok.header.difficulty + 1; //난위도올리기
  } else if (expectedTime * 2 < elapsedTime) {
    return prevAdjustmentBlcok.header.difficulty - 1;
  } else {
    return prevAdjustmentBlcok.header.difficulty;
  }
}
function getCurrentTimestamp() {
  return Math.round(Date().getTime() / 1000);
}
function isValidTimestamp(newBlock, prevBlock) {
  if (newBlock.header.timestamp - prevBlock.header.timestamp > 60) return false;
  if (getCurrentTimestamp() - newBlock.header.timestamp > 60) return false;

  return true;
}
module.exports = {
  Blocks,
  getLastBlock,
  createHash,
  nextBlock,
  getVersion,
  getBlocks,
};
