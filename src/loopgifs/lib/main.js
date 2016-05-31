import ReditApi from './redit-api.js';
import ExtractGifts from './extract-gifts.js';
import DisplayGifs from './display-gifs.js';
ReditApi.load()
  .then(ExtractGifts)
  .then(DisplayGifs)
export default {};
