'use strict'

const Bitstream = require('./Bitstream')
const HuffmanNode = require('./HuffmanNode')

class Decoder {
  constructor (data) {
    this.bitstream = new Bitstream(data)
    this.dataStream = this.bitstream.dataStream
    this.decodeHeader()
  }

  decodeSOF3 (length) {
    this.precision = this.dataStream.readUint8()
    this.lines = this.dataStream.readUint16()
    this.samples = this.dataStream.readUint16()
    this.components = this.dataStream.readUint8()
    this.componentIndex = new Array(this.components)
    this.samplingFactorH = new Array(this.components)
    this.samplingFactorV = new Array(this.components)

    for (let i = 0; i < this.components; i++) {
      let component = this.dataStream.readUint8()
      let samplingFactor = this.dataStream.readUint8()

      this.dataStream.readUint8()

      this.componentIndex[component] = i
      this.samplingFactorH[i] = samplingFactor >> 4
      this.samplingFactorV[i] = samplingFactor & 0xf
    }

    this.dataStream.seek(this.dataStream.position + length - (6 + this.components * 3))
  }

  buildTree () {
    let tableLength = 0
    let tableId = this.dataStream.readUint8()

    if (!this.huffmanTrees) {
      this.huffmanTrees = {}
    }

    this.huffmanTrees[tableId] = new HuffmanNode(this.bitstream)

    let codeLengthArray = new Array(16)

    for (let i = 0; i < 16; i++) {
      codeLengthArray[i] = this.dataStream.readUint8()
      tableLength += codeLengthArray[i]
    }

    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < codeLengthArray[i]; j++) {
        this.huffmanTrees[tableId].mostLeft(i + 1).value = this.dataStream.readUint8()
      }
    }

    return tableLength + 17
  }

  decodeDHT (length) {
    while (length > 0) {
      length -= this.buildTree()
    }
  }

  decodeSOS (length) {
    let components = this.dataStream.readUint8()

    if (!this.huffmanTreesSelected) {
      this.huffmanTreesSelected = {}
    }

    for (let i = 0; i < components; i++) {
      let component = this.dataStream.readUint8()
      let treeSelection = this.dataStream.readUint8()

      this.huffmanTreesSelected[this.componentIndex[component]] = this.huffmanTrees[treeSelection >> 4]
    }

    this.predictor = this.dataStream.readUint8()

    this.dataStream.seek(this.dataStream.position + length - (2 + components * 2))
  }

  decodeHeader () {
    let done = false
    let marker = this.dataStream.readUint16()

    if (marker !== Decoder.MARKER_SOI) {
      return
    }

    do {
      let marker = this.dataStream.readUint16()
      let length = this.dataStream.readUint16() - 2

      switch (marker) {
        case Decoder.MARKER_SOF3:
          this.decodeSOF3(length)
          break
        case Decoder.MARKER_DHT:
          this.decodeDHT(length)
          break
        case Decoder.MARKER_SOS:
          this.decodeSOS(length)
          done = true
          break
        default:
          this.dataStream.seek(this.dataStream.position + length)
          break
      }
    } while (!done)
  }

  decodeDiff (node) {
    let length = node.decode()

    if (length === 16) {
      return -32768
    }

    let diff = this.bitstream.bits(length)

    if ((diff & (1 << (length - 1))) === 0) {
      diff -= (1 << length) - 1
    }

    return diff
  }

  decode (imageArray, stripeSize) {
    let width = this.samples * this.components

    if (!stripeSize) {
      stripeSize = width
    }

    for (let i = 0; i < this.components; i++) {
      imageArray[i] = this.decodeDiff(this.huffmanTreesSelected[i]) + (1 << (this.precision - 1))
    }

    for (let x = this.components; x < this.samples * this.components; x += this.components) {
      for (let i = 0; i < this.components; i++) {
        imageArray[x + i] = this.decodeDiff(this.huffmanTreesSelected[i]) + imageArray[x + i - this.components]
      }
    }

    let offset = stripeSize

    for (let y = 1; y < this.lines; y++) {
      for (let i = 0; i < this.components; i++) {
        imageArray[offset + i] = this.decodeDiff(this.huffmanTreesSelected[i]) + imageArray[offset + i - stripeSize]
      }

      for (let x = this.components; x < this.samples * this.components; x += this.components) {
        for (let i = 0; i < this.components; i++) {
          let predictor = 0

          switch (this.predictor) {
            case 1:
              predictor = imageArray[offset + x + i - this.components]
              break
            case 6:
              predictor = imageArray[offset + x + i - stripeSize] + ((imageArray[offset + x + i - this.components] -
                imageArray[offset + x + i - this.components - stripeSize]) >> 1)
              break
          }

          imageArray[offset + x + i] = predictor + this.decodeDiff(this.huffmanTreesSelected[i])
        }
      }

      offset += stripeSize
    }
  }
}

Decoder.MARKER_SOF3 = 0xffc3
Decoder.MARKER_DHT = 0xffc4
Decoder.MARKER_SOI = 0xffd8
Decoder.MARKER_SOS = 0xffda

module.exports = Decoder
