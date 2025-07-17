import { log } from 'apify';

import inputSchema from '../.actor/input_schema.json' with {type: 'json'}
import type { Input } from "./types.js";

const { APIFY_TOKEN, ANTROPHIC_API_KEY } = process.env;

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

    if (!input.maxTweets) {
        input.maxTweets = inputSchema.properties.maxTweets.default;
        log.info(`input maxTweets not set, setting to default value: ${input.maxTweets}`);
    } else if (input.maxTweets <= 0 || input.maxTweets > inputSchema.properties.maxTweets.maximum) {
        throw new Error(`maxTweets has to be in range 0<maxTweets<=${inputSchema.properties.maxTweets.maximum}`);
    }

    return input;
}
