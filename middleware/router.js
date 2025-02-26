import { createRouter } from 'next-connect';
import openai from './model/openai';
import azure_openai from './model/azure_openai';
import mistral from './model/mistral';
import nomic from './model/nomic';
import voyageai from './model/voyageai';
import database from './database';

const baseRouter = createRouter();
baseRouter.currentModel = '';

let modelMiddleware;
if(process.env.OPENAIENDPOINT && process.env.OPENAIDEPLOYMENT && process.env.OPENAIAPIKEY){
    modelMiddleware = azure_openai;
    console.log("Using Azure OpenAI embeddings");
}else if(process.env.OPENAIAPIKEY){
    modelMiddleware = openai;
    console.log("Using OpenAI embeddings");
}else if(process.env.MISTRALAPIKEY){
    modelMiddleware = mistral;
    console.log("Using Mistral embeddings");
}else if(process.env.NOMICAPIKEY){
    modelMiddleware = nomic;
    console.log("Using Nomic embeddings");
}else if(process.env.VOYAGEAPIKEY){
    modelMiddleware = voyageai;
    console.log("Using Voyage AI embeddings");
}

// Chain middleware
baseRouter.use(database, modelMiddleware);
// Add named export forbaseRouter
export { baseRouter };