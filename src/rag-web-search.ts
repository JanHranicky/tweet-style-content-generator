import { Actor, log } from 'apify';
import type { ActorStartOptions } from 'apify-client';
import { ApifyClient } from 'apify-client';

import { type Input, MonetizationEvents, type RagWebSearchInput, type WebContent } from './types.js';

const { APIFY_TOKEN } = process.env;


/**
 * runs apify's rag-web-browser actor to crawl the web for given query. Returns an array of queried data
 * @param input tweet-style-content-generator actor's input
 * @param query user defined query, either single url or a phrase
 * @returns content array of crawled websites
*/
export async function searchQuery(input: Input, query: string): Promise<WebContent[]> {
    try {
        const ragWebSearchInput: RagWebSearchInput = {
            "query": query, // save user defined query to actors input
            "proxyConfiguration": {
                "useApifyProxy": true
            },
            "maxResults": input.maxResults,  // save user defined query to actors input
            "removeElementsCssSelector": `nav, footer, script, style, noscript, svg, img[src^='data:'], a[href],
                    [role="alert"],
                    [role="banner"],
                    [role="dialog"],
                    [role="alertdialog"],
                    [role="region"][aria-label*="skip" i],
                    [aria-modal="true"]`,
            "htmlTransformer": "extract only main content of the pages, no links or navigation. Remove newlines, whitecharacters, any style characters. Compress the content for LLM",
        };

        const client = new ApifyClient({
            token: APIFY_TOKEN,
        });

        const ragWebSearchOptions: ActorStartOptions = {
            memory: input.scrapperMemoryLimit
        }


        const run = await client.actor("apify/rag-web-browser").call(ragWebSearchInput, ragWebSearchOptions);

        await Actor.charge({ eventName: MonetizationEvents.RAG_WEB_SEARCH });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return items.map((item) => ({ metadata: item.metadata, markdown: item.markdown } as WebContent));
    } catch (error) {
        log.error(`Error while searching query: ${error}`);
        return [];
    }
}

