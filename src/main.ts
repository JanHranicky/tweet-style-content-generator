import { Actor } from 'apify';

import { transformContextToTweet } from './ai-utils.js';
import { validateInput } from './input.js';
import { searchQuery } from './rag-web-browser/rag-web-search.js';
import type { Input } from './types.js';

await Actor.init();

const originalInput = await Actor.getInput<Partial<Input>>() ?? {} as Input;
const validatedInput = validateInput(originalInput);

console.log(validatedInput)
// await transformContextToTweet();
// await searchQuery("Požár na tomorrowland");

await Actor.exit();
