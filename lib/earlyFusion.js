import {add,scale,norm,project,subtract,array} from 'vectorious';
// Methods for stearing a query vector using postive and negative inputs

// Helper function add array of vectors
function addVectors(vectors,defaultLength=1){
    let vectorSum;
    if(vectors.length > 1){
        vectorSum = vectors.reduce((acc, vec) => add(acc, vec));
    }else if(vectors.length == 1){
        vectorSum = vectors[0];
    }else{
        vectorSum = array([0],{length:defaultLength});
    }
    return vectorSum;
};


// Weighted average fusion of vectors
function centroidFusion(queryVector, positiveVectors, negativeVectors, positiveWeight, negativeWeight){
    const weightedPositiveVector = scale(addVectors(positiveVectors,queryVector.length), positiveWeight);
    const weightedNegativeVector = scale(addVectors(negativeVectors,queryVector.length), negativeWeight); 
    const numerator = subtract(add(queryVector, weightedPositiveVector), weightedNegativeVector);
    const denominator = norm(numerator);
    return scale(numerator, 1 / denominator).toArray();
};

// Linear Combination with Projection
// Per-vector orthogonal add + per-vector projection removal (simple, intuitive)

function lcpFusion(queryVector, positiveVectors, negativeVectors, positiveWeight, negativeWeight){

    // Add positive projections
    const positivePart = addVectors(positiveVectors.map((v) => {
        return scale(subtract(v, project(v, queryVector)), positiveWeight);
    }),queryVector.length);

    const negativePart = addVectors(negativeVectors.map((v) => {
        return scale(project(queryVector,v), negativeWeight);
    }),queryVector.length);

    const queryFused =  add(queryVector, subtract(positivePart, negativePart));

    return scale(queryFused, 1 / norm(queryFused)).toArray();
}

export { centroidFusion , lcpFusion };