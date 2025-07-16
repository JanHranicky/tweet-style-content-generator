import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";

import { TEST_ARTICLE,TRANSFORM_INTO_TWEET_PROMPT } from "./prompts.js";

const { ANTROPHIC_API_KEY } = process.env;
const model = new ChatAnthropic({
  model: "claude-opus-4-20250514",
  temperature: 0,
  apiKey: ANTROPHIC_API_KEY
});




export async function transformContextToTweet() {
    const systemPromptTemplate = SystemMessagePromptTemplate.fromTemplate(TRANSFORM_INTO_TWEET_PROMPT);
    const llmPrompt = await systemPromptTemplate.format({
        targetAudience: "Aspiring solopreneurs building their first online business",
        maxTweets: "3",
        emojiUsage: "none"
    });
    console.log(llmPrompt);

    const result = await model.invoke([llmPrompt, new HumanMessage(TEST_ARTICLE)]);
    console.log(result);
}

