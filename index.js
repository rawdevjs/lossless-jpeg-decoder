'use strict'

const Decoder = require('./lib/Decoder')

class LosslessJpegDecoder {
  decode (inputBuffer, outputBuffer, sliceSize) {
    let decoder = new Decoder(inputBuffer)
    let BufferType = decoder.precision > 8 ? Uint16Array : Uint8Array

    if (!outputBuffer) {
      outputBuffer = new BufferType(decoder.samples * decoder.lines * decoder.components)
    }

    if (!sliceSize) {
      sliceSize = decoder.samples * decoder.components
    }

    decoder.decode(outputBuffer, sliceSize)

    return Promise.resolve({
      width: decoder.samples,
      height: decoder.lines,
      components: decoder.components,
      bufferWidth: sliceSize,
      buffer: outputBuffer
    })
  }

  close () {}
}

module.exports = LosslessJpegDecoder
