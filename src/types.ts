export type Input = {
    query: string,
    language: string,
    audience: string,
    emojiUsage: string,
    maxTweets: number,
};

export type RagProxyConfiguration = {
    useApifyProxy: boolean
}

export type RagWebSearchInput = {
    query: string,
    proxyConfiguration: RagProxyConfiguration,
    removeElementsCssSelector: string,
    htmlTransformer: "none" | string
}

export type webContent = {
    metadata: string,
    markdown: string
}

