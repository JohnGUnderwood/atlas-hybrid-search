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
const embeddingProvider = process.env.EMBEDDING_PROVIDER || "azure_openai";

if(embeddingProvider == "azure_openai"){
    modelMiddleware = azure_openai;
    console.log("Using Azure OpenAI embeddings");
}else if(embeddingProvider == "openai"){
    modelMiddleware = openai;
    console.log("Using OpenAI embeddings");
}else if(embeddingProvider == "mistral"){
    modelMiddleware = mistral;
    console.log("Using Mistral embeddings");
}else if(embeddingProvider == "nomic"){
    modelMiddleware = nomic;
    console.log("Using Nomic embeddings");
}else if(embeddingProvider == "voyageai"){
    modelMiddleware = voyageai;
    console.log("Using Voyage AI embeddings");
}

// Chain middleware
baseRouter.use(database, modelMiddleware);
// Add named export forbaseRouter
export { baseRouter };