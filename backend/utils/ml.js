import * as tf from "@tensorflow/tfjs";

// This function calculates the cosine similarity between two vectors.
// Change the randomnessFactor to adjust the noise level to have higher variations.
// 
export function cosineSimilarity(vecA, vecB, randomnessFactor = 0.15) {
    const tensorA = tf.tensor(vecA);
    const tensorB = tf.tensor(vecB);

    const dotProduct = tf.sum(tf.mul(tensorA, tensorB));
    const normA = tf.norm(tensorA);
    const normB = tf.norm(tensorB);

    
    const noise = gaussianNoise() * randomnessFactor;

    // Calculate cosine similarity and convert it from Tensor object to regular JS
    const similarity =  dotProduct.div(normA.mul(normB)).arraySync();

    return Math.max(0, Math.min(1, similarity + noise));
}

export function gaussianNoise() {
    const mean = 0;
    const stddev = 1; // Standard deviation
    const noise = tf.randomNormal([1], mean, stddev).arraySync()[0];
    return noise;
}