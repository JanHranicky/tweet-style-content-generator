import { ChatAnthropic } from '@langchain/anthropic';
// eslint-disable-next-line import/extensions
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
// eslint-disable-next-line import/extensions
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
// eslint-disable-next-line import/extensions
import type { LLMResult } from '@langchain/core/outputs';
// eslint-disable-next-line import/extensions
import { SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { log } from "apify";

import { TRANSFORM_INTO_TWEET_PROMPT } from './prompts.js';
import type { Input, tweet, webContent } from './types.js';
import { tweetSchema } from './types.js';

const { ANTROPHIC_API_KEY } = process.env;

/**
 * Transforms input type @type {webContent[]} into @type {string} and returns it.
 * @param chunks
 * @returns stringified chunks
 */
function chunks2promptString(chunks: webContent[]): string {
    const metaDataSeparator = "\n--------------------\n\n";
    const chunkSeparator = "\n\n#######################\n\n";

    const stringChunks = chunks.map(chunk => (`${JSON.stringify(chunk.metadata)}${metaDataSeparator}${chunk.markdown}`));

    return stringChunks.join(chunkSeparator);
}

/**
 * Initializes user selected llm model
 * @param model
 * @returns
 */
function initializeModel(model: string): ChatAnthropic {
    return new ChatAnthropic({
        model,
        temperature: 0,
        apiKey: ANTROPHIC_API_KEY
    });
}

class TokenUsageHandler extends BaseCallbackHandler {
    name = "token_usage_handler";
    public totalInputTokensUsed = 0;

    /**
     * Used to count number of input tokens per call.
     * @param output
     */
    override handleLLMEnd(output: LLMResult) {
        const numOfInputTokens = output.llmOutput?.usage?.input_tokens ?? 0;
        this.totalInputTokensUsed += numOfInputTokens;
    }
}

function triggerLlmApiUsageEvent(model: string, tokensUsed: number): void {
    log.info(`${model} API call used ${tokensUsed} input tokens`)
}

/**
 * Prompts claude-opus-4-20250514 model using langchain to transform crawled web content into structurialized tweet
 * @param input
 * @param contentChunks
 * @returns generated tweets
 */
export async function generateTweetFromWebContent(input: Input, contentChunks: webContent[]): Promise<tweet> {
    try {
        const model = initializeModel(input.llmModel);
        const structuredLlm = model.withStructuredOutput(tweetSchema);

        const systemPromptTemplate = SystemMessagePromptTemplate.fromTemplate(TRANSFORM_INTO_TWEET_PROMPT);
        const systemPrompt = await systemPromptTemplate.format({
            targetLanguage: input.language,
            targetAudience: input.audience,
            maxTweets: input.maxTweets,
            emojiUsage: input.emojiUsage,
        });
        const chunksMsg = chunks2promptString(contentChunks);

        const tokenUsageHandler = new TokenUsageHandler()
        const res = await structuredLlm.invoke([new SystemMessage(systemPrompt), new HumanMessage(chunksMsg)], {
            callbacks: [tokenUsageHandler]
        });

        triggerLlmApiUsageEvent(input.llmModel, tokenUsageHandler.totalInputTokensUsed);

        return res;
    } catch (error) {
        log.error(`Error while generating tweets: ${error}`);
        return {} as tweet;
    }
}

