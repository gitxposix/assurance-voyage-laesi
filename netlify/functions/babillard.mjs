import {getStore} from '@netlify/blobs';
import {getUser,verifyRequestOrigin} from '@netlify/identity';
import sharp from 'sharp';
import initial from '../lib/initial.json' with {type:'json'};
import {createHandler} from '../lib/babillard-core.mjs';
export default createHandler({
  user:getUser,
  origin:verifyRequestOrigin,
  store:()=>getStore({name:'laesi-babillard',consistency:'strong'}),
  fallback:initial,
  imageProcessor:bytes=>sharp(bytes,{limitInputPixels:20000000}).rotate().resize({width:1200,height:800,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer()
});
