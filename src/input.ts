import { log } from 'apify';

import inputSchema from '../.actor/input_schema.json' with {type: 'json'}
import type { Input } from "./types.js";

const { APIFY_TOKEN, ANTROPHIC_API_KEY } = process.env;

/**
 * Gets actors input and validates it, fills non mandatory data with default values if they were passed in empty.
 * Throws an exception if there are missing mandatory inputs or if some inputs are not valid
 * @param input input the actor was initialized with
 * @returns validated and defaulted input
 */
export function validateInput(input: Input): Input {
    /* eslint-disable no-param-reassign */
    if (!APIFY_TOKEN)
        throw new Error("Please set APIFY_TOKEN as an enviroment variable");
    if (!ANTROPHIC_API_KEY)
        throw new Error("Please set ANTROPHIC_API_KEY as an enviroment variable");

    if (!input.query) {
        throw new Error("query is a required parameter!");
    }

    if (!input.language) {
        input.language = inputSchema.properties.language.default;
        log.info(`input language not set, setting to default value: ${input.language}`);
    }

    if (!input.audience) {
        input.audience = inputSchema.properties.audience.default;
        log.info(`input audience not set, setting to default value: ${input.audience}`);
    }

    if (!input.emojiUsage) {
        input.emojiUsage = inputSchema.properties.emojiUsage.default;
        log.info(`input emojiUsage not set, setting to default value: ${input.emojiUsage}`);
    } else if (!inputSchema.properties.emojiUsage.enum.includes(input.emojiUsage)) {
        throw new Error(`emojiUsage has to be one of ${inputSchema.properties.emojiUsage.enum.join(",")}`)
    }

    if (!input.llmModel) {
        input.llmModel = inputSchema.properties.llmModel.default;
        log.info(`input llmModel not set, setting to default value: ${input.llmModel}`);
    } else if (!inputSchema.properties.llmModel.enum.includes(input.llmModel)) {
        throw new Error(`llmModel has to be one of ${inputSchema.properties.llmModel.enum.join(",")}`)
    }

    if (!input.maxTweets) {
        input.maxTweets = inputSchema.properties.maxTweets.default;
        log.info(`input maxTweets not set, setting to default value: ${input.maxTweets}`);
    } else if (input.maxTweets <= 0 || input.maxTweets > inputSchema.properties.maxTweets.maximum) {
        throw new Error(`maxTweets has to be in range 0<maxTweets<=${inputSchema.properties.maxTweets.maximum}`);
    }

    if (!input.maxResults) {
        input.maxResults = inputSchema.properties.maxResults.default;
        log.info(`input maxResults not set, setting to default value: ${input.maxResults}`);
    } else if (input.maxResults <= 0 || input.maxResults > inputSchema.properties.maxResults.maximum) {
        throw new Error(`maxResults has to be in range 0<maxResults<=${inputSchema.properties.maxResults.maximum}`);
    }

    if (!input.scrapperMemoryLimit) {
        input.scrapperMemoryLimit = inputSchema.properties.scrapperMemoryLimit.default;
        log.info(`input maxResults not set, setting to default value: ${input.scrapperMemoryLimit}`);
    } else if (Math.log2(input.scrapperMemoryLimit) % 1 !== 0) {
        throw new Error(`scrapperMemoryLimit has to be power of 2, such as 1024, 2048, 4096, ...`);
    }

    return input;
}
