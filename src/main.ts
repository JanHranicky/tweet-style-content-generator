import { Actor, log } from 'apify';

import { generateTweetFromWebContent } from './ai-utils.js';
import { validateInput } from './input.js';
import { searchQuery } from './rag-web-search.js';
import { type Input, MonetizationEvents } from './types.js';

await Actor.init();

log.info('🎬 [main] Actor is starting up! Ready for action.');

const originalInput = await Actor.getInput<Input>();
if (!originalInput) {
    log.error('❌ [main] No input provided! Please feed me some data.');
    throw new Error("Actor input cannot be empty!");
}

const validInput = validateInput(originalInput);

await Actor.charge({ eventName: MonetizationEvents.ACTOR_START });

log.info(`🔍 [main] Searching for web content with query: "${validInput.query}"`);
const webContentChunks = await searchQuery(validInput, validInput.query);
const chunksLength = webContentChunks?.length;

log.info(`📦 [main] Scraped content contains ${chunksLength} entries.`, webContentChunks);
if (!chunksLength) {
    log.error(`😱 [main] No data found for query "${validInput.query}"!`);
    throw new Error(`No data found while searching query ${validInput.query}`);
}

log.info('✍️ [main] Generating tweets from the web content...');
const structuredTweet = await generateTweetFromWebContent(validInput, webContentChunks);
const tweetLength = structuredTweet?.num_of_tweets ?? 0;
if (!tweetLength) {
    log.error('🦗 [main] No tweets were generated. The LLM must be shy today!');
    throw new Error(`No tweets were generated.`);
}

log.info(`🎉 [main] Generated ${tweetLength} tweets!`, structuredTweet);

await Actor.pushData(structuredTweet);

log.info('🏁 [main] All done! Exiting gracefully. See you next time! 👋');

await Actor.exit();
