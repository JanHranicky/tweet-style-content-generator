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

export type WebContent = {
    metadata: string,
    markdown: string
}

export const tweetSchema = z.object({
    num_of_tweets: z.number().describe("Number of generated tweets"),
    tweets: z.string().describe("tweets in a single string"),
    tweet_array: z.array(z.string()).describe("tweets where each element is a single tweet")
});
export type tweet = z.infer<typeof tweetSchema>

export const enum MonetizationEvents {
    ACTOR_START = "actor-start",
    RAG_WEB_SEARCH = "rag-web-browser",
    CLAUDE_OPUS_4_10K = "claude-opus-4-10k-tokens",
    CLAUDE_SONNET_4_10K = "claude-sonnet-4-10k-tokens",
    CLAUDE_HAIKU_3_5_10K = "claude-haiku-3-5-10k-tokens",
}

export const model2MonetizationEvent: Record<string, MonetizationEvents> = {
    "claude-opus-4-20250514": MonetizationEvents.CLAUDE_OPUS_4_10K,
    "claude-sonnet-4-20250514": MonetizationEvents.CLAUDE_SONNET_4_10K,
    "claude-3-5-haiku-latest": MonetizationEvents.CLAUDE_HAIKU_3_5_10K,
}

