import { Actor } from 'apify';

import { transformContextToTweet } from './ai-utils.js';
import { validateInput } from './input.js';
import { searchQuery } from './rag-web-search.js';
import type { Input } from './types.js';

await Actor.init();

const originalInput = await Actor.getInput<Input>() ?? {} as Input;
const validInput = validateInput(originalInput);

const tweetContexts = await searchQuery(validInput.query);
console.log(tweetContexts);

// await transformContextToTweet();

await Actor.exit();
