import {parsePublicClient} from '../vendor/acorn.js';
import {extractGameTables} from '../data/public-tables.js';
import {runPlanning} from './planning.js';
import {prepareEngine} from '../engine/prepare.js';

self.onmessage=({data:{id,kind,input}})=>{
  try {const result=kind==='parse'?extractGameTables(input.source,parsePublicClient,input.data):
    kind==='engine'?prepareEngine(input,parsePublicClient):runPlanning(input.data,input,kind==='inspect');
    self.postMessage({id,result});
  }catch(error){self.postMessage({id,error:error.message});}
};
