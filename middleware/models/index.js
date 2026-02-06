import { AzureOpenAIModel } from "./azure_openai";
import { OpenAIModel } from "./openai";
import { MistralModel } from "./mistral";
import { NomicModel } from "./nomic";
import { VoyageAIModel } from "./voyageai";
import { OllamaModel } from "./ollama";

export default {
    aure_openai:AzureOpenAIModel,
    openai:OpenAIModel,
    mistral:MistralModel,
    nomic:NomicModel,
    voyageai:VoyageAIModel,
    ollama:OllamaModel
}