import { ChatAnthropic } from "@langchain/anthropic";
// eslint-disable-next-line import/extensions
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// eslint-disable-next-line import/extensions
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { log } from "apify";

import { TRANSFORM_INTO_TWEET_PROMPT } from "./prompts.js";
import type { Input,tweet,webContent } from "./types.js";
import { tweetSchema } from "./types.js";

const { ANTROPHIC_API_KEY } = process.env;

const model = new ChatAnthropic({
  model: "claude-opus-4-20250514",
  temperature: 0,
  apiKey: ANTROPHIC_API_KEY
});

/**
 * Transforms input type @type {webContent[]} into @type {string} and returns it.
 * @param {webContent[]} chunks
 * @returns {string}
 */
function chunks2promptString(chunks: webContent[]) {
    const metaDataSeparator = "\n--------------------\n\n";
    const chunkSeparator = "\n\n#######################\n\n";

    const stringChunks = chunks.map(chunk => (`${JSON.stringify(chunk.metadata)}${metaDataSeparator}${chunk.markdown}`));

    return stringChunks.join(chunkSeparator);
}

/**
 * Prompts claude-opus-4-20250514 model using langchain to transform crawled web content into structurialized tweet
 * @param {Input} input
 * @param {webContent[]} contentChunks
 * @returns {Promise<tweet>}
 */
export async function generateTweetFromWebContent(input: Input, contentChunks: webContent[]): Promise<tweet> {
    try {
        const structuredLlm = model.withStructuredOutput(tweetSchema);

        const systemPromptTemplate = SystemMessagePromptTemplate.fromTemplate(TRANSFORM_INTO_TWEET_PROMPT);
        const systemPrompt = await systemPromptTemplate.format({
            targetLanguage: input.language,
            targetAudience: input.audience,
            maxTweets: input.maxTweets,
            emojiUsage: input.emojiUsage,
        });
        const chunksMsg = chunks2promptString(contentChunks);

        return await structuredLlm.invoke([new SystemMessage(systemPrompt), new HumanMessage(chunksMsg)]);
    } catch (error) {
        log.error(`Error while generating tweets: ${error}`);
        return {} as tweet;
    }
}

