import OpenAI from 'openai';
import MistralClient from '@mistralai/mistralai';
import axios from 'axios';
import { OpenAIClient, AzureKeyCredential,  } from "@azure/openai";
import { createRouter } from 'next-connect';

class AzureOpenAIModel {
    
    constructor(apiKey){
        this.provider = 'azure_openai';
        this.model = process.env.OPENAIDEPLOYMENT
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536;
        try{
            this.client = new OpenAIClient(
                process.env.OPENAIENDPOINT,
                new AzureKeyCredential(apiKey)
            );
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.getEmbeddings(
                this.model,
                string
            )
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

class MistralModel {
    constructor(apiKey){
        this.provider = 'mistral';
        this.model = process.env.EMBEDDING_MODEL || "mistral-embed";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):768;
        try{
            this.client = new MistralClient(apiKey);
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.embeddings({
                model:this.model,
                input: [string]
            })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

class NomicModel {
    constructor(apiKey){
        this.provider = 'nomic';
        this.model = process.env.EMBEDDING_MODEL || "nomic-embed-text-v1";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):768;
        try{
            this.client = axios.create({
                baseURL: "https://api-atlas.nomic.ai/v1/",
                timeout: 1000,
                headers: {"Content-Type": "application/json","Authorization":`Bearer ${apiKey}`}
              });
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        if(type == "query"){
            type = "search_query"
        }else if(type == "document"){
            type = "search_document"
        }
        try{
            const resp = await this.client.post(
                "embedding/text",
                {model:this.model,"texts":[string],task_type:type}
            );
            return resp.data.embeddings[0];
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

class OpenAIModel {
    constructor(apiKey){
        this.provider = 'openai';
        this.model = process.env.EMBEDDING_MODEL || "text-embedding-ada-002";
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536;
        try{
            this.client = new OpenAI({apiKey:apiKey});
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.embeddings.create({
                model:this.model,
                input:string,
                encoding_format:"float"
              })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

class VoyageAIModel {
    constructor(apiKey){
        this.provider = 'voyageai';
        this.model = process.env.EMBEDDING_MODEL || "voyage-3";
        this.rerank_model = process.env.RERANK_MODEL || "rerank-2-lite";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1024;
        try{
            this.client = axios.create({
                baseURL: "https://api.voyageai.com/v1/",
                timeout: 1000,
                headers: {"Content-Type": "application/json","Authorization":`Bearer ${apiKey}`}
              });
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.post(
                "embeddings",
                {model:this.model,input:[string],output_dimension:this.dimensions,input_type:type}
            );
            return resp.data.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }

    rerank = async function(query,documents){
        const docMap = {}
        documents.forEach((doc,index) => {
            docMap[index] = doc;
        });
        const docStrings = documents.map((doc) => doc.description);
        try{
            const resp = await this.client.post(
                "rerank",
                {model:this.rerank_model,query:query,documents:docStrings}
            );
            const reranked = resp.data.data;
            return reranked.map(r => docMap[r.index].doc);
        }catch(error){
            console.log(`Failed to rerank documents ${error}`)
            throw error;
        }
    }
}

async function middleware(req,res,next) {
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || "azure_openai";
    let model;
    if(embeddingProvider == "azure_openai"){
        model = new AzureOpenAIModel(process.env.EMBEDDING_APIKEY || process.env.OPENAIAPIKEY); // Use APIKEY if set, otherwise use OPENAIAPIKEY
        console.log("Using Azure OpenAI embeddings");
    }else if(embeddingProvider == "openai"){
        model = new OpenAIModel(process.env.EMBEDDING_APIKEY);
        console.log("Using OpenAI embeddings");
    }else if(embeddingProvider == "mistral"){
        model = new MistralModel(process.env.EMBEDDING_APIKEY);
        console.log("Using Mistral embeddings");
    }else if(embeddingProvider == "nomic"){
        model = new NomicModel(process.env.EMBEDDING_APIKEY);
        console.log("Using Nomic embeddings");
    }else if(embeddingProvider == "voyageai"){
        model = new VoyageAIModel(process.env.EMBEDDING_APIKEY);
        console.log("Using Voyage AI embeddings");
    }

    const rerankProvider = process.env.RERANK_PROVIDER;
    let rerank_model;
    if(rerankProvider == "voyageai"){
        rerank_model = new VoyageAIModel(process.env.RERANK_APIKEY);
        console.log("Using Voyage AI reranking");
    }
    
    req.model = model;
    req.rerank_model = rerank_model;
    return next();
}
  
const model = createRouter();
model.use(middleware);
  
export default model;