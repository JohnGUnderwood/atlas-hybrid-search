
import { createRouter } from 'next-connect';
import Models from '../middleware/models';

let modelInstance = null;

async function initializeModel(){
    if(!modelInstance){
        const embeddingProvider = process.env.EMBEDDING_PROVIDER || "azure_openai";
        let model;
        if(embeddingProvider == "azure_openai"){
            model = new Models.aure_openai(process.env.EMBEDDING_APIKEY || process.env.OPENAIAPIKEY); // Use APIKEY if set, otherwise use OPENAIAPIKEY
            console.log("Using Azure OpenAI embeddings");
        }else if(embeddingProvider == "openai"){
            model = new Models.openai(process.env.EMBEDDING_APIKEY);
            console.log("Using OpenAI embeddings");
        }else if(embeddingProvider == "mistral"){
            model = new Models.mistral(process.env.EMBEDDING_APIKEY);
            console.log("Using Mistral embeddings");
        }else if(embeddingProvider == "nomic"){
            model = new Models.nomic(process.env.EMBEDDING_APIKEY);
            console.log("Using Nomic embeddings");
        }else if(embeddingProvider == "voyageai"){
            model = new Models.voyageai(process.env.EMBEDDING_APIKEY);
            console.log("Using Voyage AI embeddings");
        }else if(embeddingProvider == "ollama"){
            model = new Models.ollama();
            console.log("Using Ollama embeddings");
        }else if(embeddingProvider == "atlas"){
            model = new Models.atlas(process.env.EMBEDDING_APIKEY);
            console.log("Using Atlas Voyage embeddings");
        }

        const rerankProvider = process.env.RERANK_PROVIDER;
        let rerank_model;
        if(rerankProvider == "voyageai"){
            rerank_model = new Models.voyageai(process.env.RERANK_APIKEY);
            console.log("Using Voyage AI reranking");
        }else if(rerankProvider == "atlas"){
            rerank_model = new Models.atlas(process.env.RERANK_APIKEY);
            console.log("Using Atlas Voyage reranking");
        }

        modelInstance = {model, rerank_model};
    }
    return modelInstance;
}

// Initialize immediately and store promise
const modelInitPromise = initializeModel();

async function middleware(req,res,next) {
    try{
        // Ensure model is initialized
        await modelInitPromise;
        if (!modelInstance) {
            throw new Error('Model failed to initialize');
        }
        req.model = modelInstance.model;
        req.rerank_model = modelInstance.rerank_model;
        return next();
    }catch(error){
        console.log("Model middleware error",error); 
        return res.status(500).json({ 
            error: 'Model initialization failed',
            message: error.message 
        });
    }
}
  
const modelRouter = createRouter();
modelRouter.use(middleware);

export default modelRouter;