'use strict'

class HuffmanNode {
  constructor (bitstream) {
    this.bitstream = bitstream
    this.nodes = [null, null]
    this.value = undefined
  }

  mostLeft (level) {
    if (this.value !== undefined) {
      return null
    }

    if (level === 0) {
      return this
    }

    for (var i = 0; i < 2; i++) {
      let nextNode = null

      if (this.nodes[i] === null) {
        this.nodes[i] = new HuffmanNode(this.bitstream)
      }

      if ((nextNode = this.nodes[i].mostLeft(level - 1)) != null) {
        return nextNode
      }
    }

    return null
  }

  decode () {
    let nextNode = this.nodes[this.bitstream.bit()]

    if (nextNode === null) {
      return null
    }

    if (nextNode.value !== undefined) {
      return nextNode.value
    }

    return nextNode.decode()
  }
}

module.exports = HuffmanNode
