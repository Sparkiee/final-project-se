import OpenAI from "openai";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function getEmbedding(text) {
    try {
        // text can be passed as either array or text
        const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
        });

        const embeddings = response.data.map((item, index) => ({
            text: text[index], // Original text
            embedding: item.embedding, // Corresponding embedding
        }));
        return embeddings;
    } catch (error) {
        console.error(error);
        return null;
    }
}
