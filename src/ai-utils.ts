import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { log } from "apify";
import * as z from "zod";

import { TRANSFORM_INTO_TWEET_PROMPT } from "./prompts.js";
import type { Input,tweet,webContent } from "./types.js";
import { tweetSchema } from "./types.js";

const { ANTROPHIC_API_KEY } = process.env;

const model = new ChatAnthropic({
  model: "claude-opus-4-20250514",
  temperature: 0,
  apiKey: ANTROPHIC_API_KEY
});


function chunks2promptString(chunks: webContent[]) {
    const metaDataSeparator = "\n--------------------\n\n";
    const chunkSeparator = "\n\n#######################\n\n";

    const stringChunks = chunks.map(chunk => (`${JSON.stringify(chunk.metadata)}${metaDataSeparator}${chunk.markdown}`));

    return stringChunks.join(chunkSeparator);
}

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

