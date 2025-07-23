import z from "zod";

export type Input = {
    query: string,
    language: string,
    audience: string,
    emojiUsage: string,
    maxTweets: number,
    maxResults: number,
    scrapperMemoryLimit: number
    llmModel: string
};

export type RagProxyConfiguration = {
    useApifyProxy: boolean
}

export type RagWebSearchInput = {
    query: string,
    proxyConfiguration: RagProxyConfiguration,
    maxResults: number,
    removeElementsCssSelector: string,
    htmlTransformer: "none" | string
}

export type webContent = {
    metadata: string,
    markdown: string
}

export const tweetSchema = z.object({
    num_of_tweets: z.number().describe("Number of generated tweets"),
    tweets: z.string().describe("tweets in a single string"),
    tweet_array: z.array(z.string()).describe("tweets where each element is a single tweet")
});
export type tweet = z.infer<typeof tweetSchema>

