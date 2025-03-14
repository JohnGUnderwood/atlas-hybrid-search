function setVariables(pipeline,searchIndex,vectorIndex,searchCollection){
    // This function sets search/vector index names and collection names in the pipeline.    
    try{
        var newPipeline = [];
        pipeline.forEach(stage => {
            if('$search' in stage){
                newPipeline.push({...stage,$search:{...stage.$search, index:searchIndex}})
            }else if('$vectorSearch' in stage){
                newPipeline.push({...stage,$vectorSearch:{...stage.$vectorSearch, index:vectorIndex}})
            }else if('$unionWith' in stage){
                newPipeline.push({...stage,$unionWith:{...stage.$unionWith,coll:searchCollection,pipeline:setVariables(stage.$unionWith.pipeline,searchIndex,vectorIndex,searchCollection)}})
            }else{
                newPipeline.push(stage);
            }
        });
        return newPipeline;
    }catch(error){
        throw error;
    }   
}

async function getResults(collection,pipeline,searchIndex,vectorIndex){
    try{
        const collectionName = collection.collectionName;
        const newPipeline = setVariables(pipeline,searchIndex,vectorIndex,collectionName);
        const start = new Date();
        const results = await collection.aggregate(newPipeline).toArray();
        const end   = new Date();
        const time = (end - start);
        return {results:results,query:newPipeline,time:time};
    }catch(error){
        throw error
    }
}

export default getResults;