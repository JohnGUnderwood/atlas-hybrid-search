import { array, add } from 'vectorious';

import { centroidFusion, lcpFusion } from './lib/earlyFusion.js';

// Create some sample vectors
const query = array([1, 2, 3]);
const positives = [array([4, 5, 6])];
const negatives = [array([7, 8, 9])];

// Call your function
const centroidResult = centroidFusion(query, positives, negatives, 1, 1);
const lcpResult = lcpFusion(query, positives, negatives, 1, 1);

// Print the result
console.log(centroidResult);
console.log(lcpResult);
