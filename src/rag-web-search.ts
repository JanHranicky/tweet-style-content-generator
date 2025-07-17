import { ApifyClient } from 'apify-client';

import type { RagWebSearchInput, tweetContext } from './types.js';

const { APIFY_TOKEN } = process.env;

const ragWebSearchInput: RagWebSearchInput  = {
        "query": "",
        "proxyConfiguration": {
            "useApifyProxy": true
        },
        "removeElementsCssSelector": `nav, footer, script, style, noscript, svg, img[src^='data:'], a[href],
            [role="alert"],
            [role="banner"],
            [role="dialog"],
            [role="alertdialog"],
            [role="region"][aria-label*="skip" i],
            [aria-modal="true"]`,
        "htmlTransformer": "extract only main content of the pages, no links or navigation. Remove excess newlines and whitespaces"
    };


export async function searchQuery(query: string): Promise<tweetContext[]> {
    const client = new ApifyClient({
        token: APIFY_TOKEN,
    });

    ragWebSearchInput.query = query; // save user defined query to actors input

    const run = await client.actor("apify/rag-web-browser").call(ragWebSearchInput);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    items.forEach((item) => {
        console.dir(item);
    });

    return items.map((item) => ({metadata: item.metadata, markdown: item.markdown} as tweetContext));
}

