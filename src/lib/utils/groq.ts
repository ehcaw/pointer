import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAutocomplete = async (
  fullText: string,
  currLine: string,
) => {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `<task>
You are an autocompletion system that suggests text completions.
Your name is quibble.

Rules:
- USE the provided context in <context> tags
- Read CAREFULLY the input text in <input> tags
- Suggest up to 10 words maximum
- Ensure suggestions maintain semantic meaning
- Wrap completion in <completion> tags
- Return only the completion text
- Periods at the end of the completion are OPTIONAL, not fully required
</task>

<example>
<context>Math Academy is a challenging but rewarding platform for learning math.</context>
<input>Math Academy teaches</input>
<completion> math in a fun and engaging way.</completion>
</example>`,
    prompt: `<context>
${fullText}
</context>
<input>
${currLine}
</input>
Do not wrap the completion in <completion> tags.
Your completion:`,
  });
  console.log(text);
  return text;
};
