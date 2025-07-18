import { log } from 'apify';
import type { ActorStartOptions} from 'apify-client';
import { ApifyClient } from 'apify-client';

import type { Input, RagWebSearchInput, webContent } from './types.js';

const { APIFY_TOKEN } = process.env;

const ragWebSearchInput: RagWebSearchInput  = {
        "query": "",
        "proxyConfiguration": {
            "useApifyProxy": true
        },
        "maxResults": 3,
        "removeElementsCssSelector": `nav, footer, script, style, noscript, svg, img[src^='data:'], a[href],
            [role="alert"],
            [role="banner"],
            [role="dialog"],
            [role="alertdialog"],
            [role="region"][aria-label*="skip" i],
            [aria-modal="true"]`,
        "htmlTransformer": "extract only main content of the pages, no links or navigation. Remove newlines, whitecharacters, any style characters. Compress the content for LLM",
    };

/**
 * runs apify's rag-web-browser actor to crawl the web for given query. Returns an array of queried data
 * @param {Input} input tweet-style-content-generator actor's input
 * @param {string} query user defined query, either single url or a phrase
 * @returns {Promise<webContent[]>} content array of crawled websites
 */
export async function searchQuery(input: Input, query: string): Promise<webContent[]> {
    try {
        const client = new ApifyClient({
            token: APIFY_TOKEN,
        });

        const ragWebSearchOptions: ActorStartOptions = {
            memory: input.scrapperMemoryLimit
        }

        ragWebSearchInput.query = query; // save user defined query to actors input
        ragWebSearchInput.maxResults = input.maxResults; // save user defined query to actors input

        const run = await client.actor("apify/rag-web-browser").call(ragWebSearchInput, ragWebSearchOptions);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return items.map((item) => ({metadata: item.metadata, markdown: item.markdown} as webContent));
    } catch (error) {
        log.error(`Error while searching query: ${error}`);
        return [];
    }
}

