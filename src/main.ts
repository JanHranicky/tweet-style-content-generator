import { Actor } from 'apify';
import { ApifyClient } from 'apify-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

await Actor.init();

const client = new ApifyClient({
    token: '',
});

// Prepare Actor input
const input = {
    "query": "web browser for RAG pipelines -site:reddit.com",
    "proxyConfiguration": {
        "useApifyProxy": true
    },
    "removeElementsCssSelector": `nav, footer, script, style, noscript, svg, img[src^='data:'],
        [role="alert"],
        [role="banner"],
        [role="dialog"],
        [role="alertdialog"],
        [role="region"][aria-label*="skip" i],
        [aria-modal="true"]`,
    "htmlTransformer": "none"
};

// Run the Actor and wait for it to finish
const run = await client.actor("apify/rag-web-browser").call(input);

// Fetch and print Actor results from the run's dataset (if any)
console.log('Results from dataset');
console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
const { items } = await client.dataset(run.defaultDatasetId).listItems();
items.forEach((item) => {
    console.dir(item);
});

await Actor.exit();
