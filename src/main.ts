import { Actor } from 'apify';

import { transformContextToTweet } from './ai-utils.js';
import { searchQuery } from './rag-web-browser/rag-web-search.js';

await Actor.init();

await transformContextToTweet();
// await searchQuery("Aktuální zprávy z Prahy");

await Actor.exit();
