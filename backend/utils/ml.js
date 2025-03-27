import * as tf from "@tensorflow/tfjs";

function cosineSimilarity(vecA, vecB) {
    const tensorA = tf.tensor(vecA);
    const tensorB = tf.tensor(vecB);

    const dotProduct = tf.sum(tf.mul(tensorA, tensorB));
    const normA = tf.norm(tensorA);
    const normB = tf.norm(tensorB);

    // Calculate cosine similarity and convert it from Tensor object to regular JS
    return dotProduct.div(normA.mul(normB)).arraySync();
}