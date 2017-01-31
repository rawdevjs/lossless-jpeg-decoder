# lossless-jpeg-decoder

Decoder for lossless JPEG compression.

## Usage

The module returns a decoder class with the following interface:
 
- `decode(TypedArray inputBuffer, [TypedArray outputBuffer], [Number sliceSize])`:
  Decodes the JPEG stored in `inputBuffer`.
  If `outputBuffer` is given it will be used to store the decoded image.
  If `sliceSize` is given it will be used as length for each line.
  This us useful for tiled decoding or WebGL textures with a size of 2^x.
- `close()`:
  Will destroy WebWorkers, if they are used for decoding (currently not implemented).

### Example

```
// load the LosslessJpegDecoder class
const LosslessJpegDecoder = require('lossless-jped-decoder')

// create an instance
let decoder = new LosslessJpegDecoder()

// input must be the JPEG binary as TypedArray
let input = new Uint8Array()

// decode the JPEG
decoder.decode(input).then((image) => {
  // log all image properties 
  console.log('image width: ' + image.width)
  console.log('image height: ' + image.height)
  console.log('number of components: ' + image.components)
  console.log('width of each line in the buffer: ' + image.bufferWidth)
  console.log('number of elements in the buffer: ' + buffer.length)

  // close the decoder (if WebWorkers were used, will destroy them)
  decoder.close()
})

```
