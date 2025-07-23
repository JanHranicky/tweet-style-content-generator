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
    log.info(`🧮 [triggerLlmApiUsageEvent] "${model}" munched through ${tokensUsed} input tokens!`);
    const count = Math.ceil(tokensUsed / TEN_THOUSAND);
    const eventName = model2MonetizationEvent[model];

    log.info(`💸 [triggerLlmApiUsageEvent] Charging event "${eventName}" ${count} time(s) for LLM wizardry!`);
    await Actor.charge({ eventName, count });
    log.info(`✅ [triggerLlmApiUsageEvent] Monetization event "${eventName}" charged successfully.`);
}

/**
 * Prompts selected model using langchain to transform crawled web content into structurialized tweet
 * @param input
 * @param contentChunks
 * @returns generated tweets
 */
export async function generateTweetFromWebContent(input: Input, contentChunks: WebContent[]): Promise<tweet> {
    log.info(`🐦✨ [generateTweetFromWebContent] Time to turn web wisdom into tweet magic!`);
    log.info(`🛠️ [generateTweetFromWebContent] Settings: Model="${input.llmModel}", Language="${input.language}", Audience="${input.audience}", MaxTweets=${input.maxTweets}, EmojiUsage="${input.emojiUsage}"`);
    try {
        const model = initializeModel(input.llmModel);
        log.info(`🤖 [generateTweetFromWebContent] Model "${input.llmModel}" is booted up and ready to tweet!`);

        const structuredLlm = model.withStructuredOutput(tweetSchema);

        const systemPromptTemplate = SystemMessagePromptTemplate.fromTemplate(TRANSFORM_INTO_TWEET_PROMPT);
        const systemPrompt = await systemPromptTemplate.format({
            targetLanguage: input.language,
            targetAudience: input.audience,
            maxTweets: input.maxTweets,
            emojiUsage: input.emojiUsage,
        });
        log.debug(`📝 [generateTweetFromWebContent] Crafted system prompt for the LLM: ${systemPrompt}`);

        const chunksMsg = chunks2promptString(contentChunks);
        log.info(`📦 [generateTweetFromWebContent] Packing ${contentChunks.length} content chunks into a ${chunksMsg.length}-character message for the LLM!`);

        const tokenUsageHandler = new TokenUsageHandler();
        log.info(`🧠 [generateTweetFromWebContent] Sending prompt to the LLM... Fingers crossed for tweet brilliance!`);
        const res = await structuredLlm.invoke([new SystemMessage(systemPrompt), new HumanMessage(chunksMsg)], {
            callbacks: [tokenUsageHandler]
        });

        log.info(`🔢 [generateTweetFromWebContent] LLM used ${tokenUsageHandler.totalInputTokensUsed} tokens to cook up some tweets!`);
        log.debug(`🧾 [generateTweetFromWebContent] LLM response sneak peek: ${JSON.stringify(res).slice(0, 500)}...`);

        await triggerLlmApiUsageEvent(input.llmModel, tokenUsageHandler.totalInputTokensUsed);

        log.info(`🎉 [generateTweetFromWebContent] Tweets are hot off the press and ready to fly!`);
        return res;
    } catch (error) {
        log.error(`💥 [generateTweetFromWebContent] Yikes! Tweet generation crashed: ${error instanceof Error ? error.stack : error}`);
        return {} as tweet;
    }
}
