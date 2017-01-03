'use strict'

const DataStream = require('datastream.js')

class Bitstream {
  constructor (data) {
    this.dataStream = new DataStream(data, 0, DataStream.BIG_ENDIAN)
    this.bytePosition = 0
    this.byteBuffer = 0
  }

  bit () {
    if (this.bytePosition === 0) {
      this.byteBuffer = this.dataStream.readUint8()

      if (this.byteBuffer === 0xff) {
        this.dataStream.readUint8()
      }

      this.bytePosition = 8
    }

    return (this.byteBuffer >> --this.bytePosition) & 1
  }

  bits (length) {
    let nextLength = Math.min(this.bytePosition, length)
    length -= nextLength
    this.bytePosition -= nextLength
    let currentBits = (this.byteBuffer >> this.bytePosition) & ((1 << nextLength) - 1)

    while (length > 0) {
      this.byteBuffer = this.dataStream.readUint8()

      if (this.byteBuffer === 0xff) {
        this.dataStream.readUint8()
      }

      nextLength = Math.min(8, length)
      length -= nextLength
      this.bytePosition = 8 - nextLength

      currentBits <<= nextLength
      currentBits |= (this.byteBuffer >> this.bytePosition) & ((1 << nextLength) - 1)
    }

    return currentBits
  }
}

module.exports = Bitstream
