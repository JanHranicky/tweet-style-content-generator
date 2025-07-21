import { Actor, log } from 'apify';

import { generateTweetFromWebContent } from './ai-utils.js';
import { validateInput } from './input.js';
import { searchQuery } from './rag-web-search.js';
import type { Input } from './types.js';

await Actor.init();

const originalInput = await Actor.getInput<Input>();
if (!originalInput) {
    throw new Error("Actor input cannot be empty!");
}

const validInput = validateInput(originalInput);

const webContentChunks = await searchQuery(validInput, validInput.query);
const chunksLength = webContentChunks?.length;

log.info(`Scrapped content contains ${chunksLength} entries`, webContentChunks);
if (!chunksLength)
    throw new Error(`No data found while searching query ${validInput.query}`);

const structuredTweet = await generateTweetFromWebContent(validInput, webContentChunks);
const tweetLength = structuredTweet?.num_of_tweets ?? 0;
if (!tweetLength)
    throw new Error(`No tweets were generated.`)

log.info(`Generated ${tweetLength} tweets`, structuredTweet);

await Actor.pushData(structuredTweet);

await Actor.exit();
