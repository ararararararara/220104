const merkle = require("merkle");
const {
  getVersion,
  createHash,
  Blocks,
  getLastBlock,
  nextBlock,
} = require("./chainedBlock");

function isValidBlockStructure(block) {
  return (
    typeof block.header.version === "string" &&
    typeof block.header.index === "number" &&
    typeof block.header.previousHash === "string" &&
    typeof block.header.timestamp === "number" &&
    typeof block.header.merkleRoot === "string" &&
    typeof block.header.difficulty === "number" &&
    typeof block.header.nonce === "number" &&
    typeof block.body === "object"
  );
}

function isValidNewBlock(newBlock, previousBlock) {
  if (isValidBlockStructure(newBlock) === false) {
    console.log("invalid Block Structure");
    return false;
  } else if (newBlock.header.index !== previousBlock.header.index + 1) {
    console.log("invalid index");
    return false;
  } else if (createHash(previousBlock) !== newBlock.header.previousHash) {
    console.log("invalid previousHash");
    return false;
  } else if (
    (newBlock.body.length === 0 &&
      "0".repeat(64) !== newBlock.header.merkleRoot) ||
    (newBlock.body.length !== 0 &&
      merkle("sha256").sync(newBlock.body).root() !==
        newBlock.header.merkleRoot)
  ) {
    console.log("invalid merkleRoot");
    return false;
  }
  ///////////////////////////////////추가
  else if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log("Invalid Timestamp");
    return false;
  } else if (
    !hashMatchesDifficulty(createHash(newBlock), newBlock.header.difficulty)
  ) {
    console.log("Invalid hash");
    return false;
  }
  return true;
}

//////////////
function isValidChain(newBlocks) {
  if (JSON.stringify(newBlocks[0]) !== JSON.stringify(Blocks[0])) {
    return false;
  }
  var tempBlocks = [newBlocks[0]];

  for (var i = 1; i < newBlocks.length; i++) {
    if (isValidNewBlock(newBlocks[i], tempBlocks[i - 1])) {
      tempBlocks.push(newBlocks[i]);
    } else {
      return false;
    }
  }
  return true;
}
function addBlock(newBlock) {
  if (isValidNewBlock(newBlock, getLastBlock())) {
    Blocks.push(newBlock);
    return true;
  }
  return false;
}
const block = nextBlock(["new Transaction"]);
addBlock(block);

console.log(Blocks);
module.exports = {
  Blocks,
  getLastBlock,
  createHash,
  addBlock,
  nextBlock,
  getVersion,
};
