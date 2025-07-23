import { ChatAnthropic } from '@langchain/anthropic';
// eslint-disable-next-line import/extensions
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
// eslint-disable-next-line import/extensions
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
// eslint-disable-next-line import/extensions
import type { LLMResult } from '@langchain/core/outputs';
// eslint-disable-next-line import/extensions
import { SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { Actor, log } from "apify";

import { TRANSFORM_INTO_TWEET_PROMPT } from './prompts.js';
import type { Input, tweet, WebContent } from './types.js';
import { model2MonetizationEvent, tweetSchema } from './types.js';

const { ANTROPHIC_API_KEY } = process.env;

const MAX_PROMPT_LENGTH = 200000 - TRANSFORM_INTO_TWEET_PROMPT.length;
const TEN_THOUSAND = 10000; // number of tokens per monetization event

/**
 * Transforms input type @type {WebContent[]} into @type {string} and returns it.
 * @param chunks
 * @returns stringified chunks
 */
function chunks2promptString(chunks: WebContent[]): string {
    const metaDataSeparator = "\n--------------------\n\n";
    const chunkSeparator = "\n\n#######################\n\n";

    const stringChunks = chunks.map(chunk => (`${JSON.stringify(chunk.metadata)}${metaDataSeparator}${chunk.markdown}`));
    const joinedPrompt = stringChunks.join(chunkSeparator);

    return joinedPrompt.length > MAX_PROMPT_LENGTH ? joinedPrompt.slice(0, MAX_PROMPT_LENGTH) : joinedPrompt;
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

async function triggerLlmApiUsageEvent(model: string, tokensUsed: number): Promise<void> {
    log.info(`${model} API call used ${tokensUsed} input tokens`);
    const count = Math.ceil(tokensUsed / TEN_THOUSAND);
    const eventName = model2MonetizationEvent[model];

    log.info(`about to charge event ${eventName}: ${count} time/s`);

    await Actor.charge({ eventName, count });
}

/**
 * Prompts selected model using langchain to transform crawled web content into structurialized tweet
 * @param input
 * @param contentChunks
 * @returns generated tweets
 */
export async function generateTweetFromWebContent(input: Input, contentChunks: WebContent[]): Promise<tweet> {
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

        await triggerLlmApiUsageEvent(input.llmModel, tokenUsageHandler.totalInputTokensUsed);

        return res;
    } catch (error) {
        log.error(`Error while generating tweets: ${error} `);
        return {} as tweet;
    }
}

