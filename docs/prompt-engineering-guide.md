# Prompt Engineering: Comprehensive Guide

> Compiled from 5 expert video courses covering Google's Prompt Engineering Essentials, FreeCodeCamp's prompt engineering course, advanced LLM techniques, 21 professional prompts, and AI agent prompting strategies.

---

## Table of Contents

1. [Core Frameworks](#1-core-frameworks)
2. [Fundamental Principles](#2-fundamental-principles)
3. [Prompt Structure & Formatting](#3-prompt-structure--formatting)
4. [Advanced Techniques](#4-advanced-techniques)
5. [Use Case Specific Tips](#5-use-case-specific-tips)
6. [Common Mistakes to Avoid](#6-common-mistakes-to-avoid)
7. [Prompt Templates](#7-prompt-templates)
8. [Key Takeaways](#8-key-takeaways)

---

## 1. Core Frameworks

### 1.1 TCREI Framework (Google's 5-Step Prompting Framework)

Google's Prompt Engineering Essentials course introduces a five-step framework for designing prompts. The mnemonic is **"Tiny Crabs Ride Enormous Iguanas"** (TCREI):

| Step | Name | Description |
|------|------|-------------|
| **T** | Task | What you want the AI to do. Be specific about the desired outcome. |
| **C** | Context | Background information that helps the AI understand your situation. The more context, the better the output. |
| **R** | References | Examples, samples, or reference materials that show the AI what you want. Especially useful when it's hard to describe in words. |
| **E** | Evaluate | After receiving output, ask: "Is this what I wanted?" |
| **I** | Iterate | Refine and re-prompt. Prompting is a circular process, not a one-shot attempt. ABI = Always Be Iterating. |

**When to use:** Every single prompt. This is the foundational framework that all other techniques build upon.

**Example — without framework:**
```
Suggest a gift for my friend's birthday.
```

**Example — with framework:**
```
Act as an anime expert (Task + Persona).
Suggest an anime gift for my friend's birthday.
She is turning 29. Her favorite animes are Shangri-La Frontier, Solo Leveling, and Naruto (Context).
In the past, she enjoyed a custom Naruto hoodie and a manga box set (References).
Organize the suggestions into a table with columns: Gift, Anime, Price Range (Format).
```

---

### 1.2 RSTI Framework (4 Iteration Methods)

When the TCREI framework gets you 80% of the way but not to 100%, use these four iteration methods. Mnemonic: **"Ramen Saves Tragic Idiots"** (RSTI):

| Method | Description | When to use |
|--------|-------------|-------------|
| **R** — Revisit the Framework | Go back to TCREI. Add more context, references, examples, or a persona. | When the output is decent but not quite right. |
| **S** — Separate into Shorter Sentences | Break complex prompts into simpler, shorter sentences. Feed information to the AI gradually instead of in one block. | When the AI seems overwhelmed or confused by a long prompt. |
| **T** — Try Different Phrasing / Analogous Task | Rephrase the request or switch to an analogous task. E.g., instead of "write a marketing plan," ask it to "write a story about how this product fits into the lives of our target customers." | When outputs feel boring, bland, or generic despite good structure. |
| **I** — Introduce Constraints | Add limitations to narrow the focus. Constraints prevent the "anything goes" problem. | When outputs are too broad, unfocused, or uninteresting. |

**Example of constraints:**
```
Generate a playlist for a road trip.
Constraints: Only songs from the American South. Only songs at 120+ BPM.
Only songs about heartbreak.
```

---

### 1.3 Role-Audience-Tone-Format (RATF) Framework

A simplified but powerful framework for steering any prompt:

| Component | What it does | Example |
|-----------|-------------|---------|
| **Role** | Who the AI should be | "You are a senior B2B copywriter" |
| **Audience** | Who the output is for | "The audience is ops managers at midsize companies" |
| **Tone** | How it should sound | "Confident but not salesy" |
| **Format** | What the output looks like | "Two-sentence LinkedIn ad ending with a clear CTA" |

**When to use:** Any time you need a quick framework to drastically improve a basic prompt. Including all four of these will almost always give a significantly better result than simply commanding the model to do something.

**Bad prompt:**
```
Reply to this customer complaint.
```

**Good prompt (with RATF):**
```
You are a customer support lead (Role).
Reply to this complaint from a paying user whose export failed twice.
Acknowledge the frustration. Apologize briefly.
Confirm we're investigating and offer a concrete next step (e.g., "we'll email within 24 hours").
Keep it under 150 words. Sign off as "the support team" (Format).
```

---

### 1.4 Long Structured Prompting Framework (for AI Agents)

A six-section framework specifically designed for complex tasks, AI agents, and automations:

| Section | Purpose | Details |
|---------|---------|---------|
| **1. Role / Persona** | Define expertise and background | "You are a world-class personal administration AI agent" |
| **2. Objective / Task** | Clear goal statement | "Your goal is to help the user manage email, calendar, and research" |
| **3. Context** | Why the task matters | "You will be triggered by user requests. It is vital to the user's productivity..." |
| **4. Instructions / Rules** | Constraints, formats, don'ts | "Never assume missing details. Ask for clarification." |
| **5. Examples** | Input/output pairs | Show the AI what correct execution looks like |
| **6. Variables** | Placeholders for dynamic data | `{{user_timezone}}`, `{{email_body}}` |

**For AI Agents specifically, add:**
- **SOP (Standard Operating Procedure):** Numbered step-by-step process the agent must follow
- **Tools & Sub-agents:** Descriptions and use cases for each tool/sub-agent available
- **Notes:** Final reminders placed at the very end (LLMs weight beginnings and endings most heavily)

---

### 1.5 Proactive vs. Reactive Prompting (Strategic Approaches)

Two fundamentally different approaches to building prompts:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Proactive** | Write a comprehensive prompt upfront with extensive rules and edge cases | Fast to deploy initially | Hard to debug, high cost per execution, may miss real edge cases |
| **Reactive** | Start simple, add instructions only when specific errors appear in production | Easier to debug, lower cost, every line is justified | Takes more time upfront for testing |

**Golden Rule:** Fix one problem at a time and iterate based on real failures. This minimizes costs and maximizes efficiency.

---

## 2. Fundamental Principles

### 2.1 Be Specific, Not Vague

The single most important principle across all five courses. Never assume the AI knows what you mean.

| Bad | Good |
|-----|------|
| "When is the election?" | "When is the next presidential election for Poland?" |
| "Write code to filter ages from data" | "Write a JavaScript function that takes an array of objects and filters out the value of the age property into a new array. Explain each code snippet." |
| "Write something about our product" | "You are a senior B2B copywriter. Write a two-sentence LinkedIn ad for our project management SaaS, a Asana alternative. The audience is ops managers at midsize companies." |
| "Help me with my essay" | "You are a tutor. Help me improve the thesis and first paragraph of this 500-word history essay on the causes of World War I. Keep my voice. Adjust edits in line." |

### 2.2 Steer, Don't Command

The difference between amateur and professional prompting:

- **Commanding:** "Summarize this." (The model chooses length, style, and focus.)
- **Steering:** "You are an executive assistant. Summarize the meeting transcript in four bullet points. Focus on decisions and action items. No filler." (You define length, focus, and format.)

When you steer, you indicate the length, the focus, and the format. When you command, the model picks all of those for you.

### 2.3 Context Is Everything (But Not Too Much)

- More context generally produces better output
- But too much context can be counterproductive
- The sweet spot: enough information to understand your situation without overwhelming with irrelevant details
- Be careful about sensitive data — do not violate privacy policies or input confidential information into AI models

### 2.4 Always Be Iterating (ABI)

Prompting is rarely a one-and-done process. Treat it as a conversation, not a one-shot attempt. The first reply is often not perfect — refine by saying "shorter," "more formal," "add another example," "focus only on X."

### 2.5 Prompting Is Programming in Natural Language

Think of prompt engineering like programming, but instead of Python or JavaScript, you use plain language. You must define the task, the role, the format, and the constraints within the prompt. The same model can seem brilliant or useless depending on the clarity, context, and structure you provide.

### 2.6 Understand How LLMs Think

- An LLM is fundamentally a **text prediction model** — it predicts the next token based on training data
- By default, LLMs have **no memory** — memory is simulated by injecting previous conversation into the prompt
- **Your prompt is rarely the only thing the LLM sees.** Tools like ChatGPT inject system prompts, conversation history, tool descriptions, and other context behind the scenes
- The context, specificity, and structure you provide shapes what the model says next

### 2.7 The Power of Constraints and Negative Instructions

Sometimes the best prompts focus more on what NOT to do than what to do. Telling the AI what to avoid is often more powerful than telling it what to include.

**Example:**
```
Write a short intro for our onboarding doc.
Start directly with what the user will do in this section.
Do NOT start with "Welcome" or generic greetings.
Do NOT use the phrase "limited access."
Do NOT say "reply when I can" or "thank you for your patience."
```

### 2.8 Human-in-the-Loop

AI outputs can contain hallucinations (incorrect, inconsistent, or nonsensical information) and biases (gender, race, etc. inherited from training data). Always verify outputs. It is your responsibility to ensure accuracy.

### 2.9 Use Markdown Formatting in Prompts

LLMs understand markdown formatting best. Use:
- `#` for headings, `##` for subheadings
- `**bold**` to emphasize important text
- `-` for unordered lists, `1.` for ordered lists
- `---` for horizontal rules / section dividers

This helps the AI parse the structure of your prompt more effectively.

---

## 3. Prompt Structure & Formatting

### 3.1 The Anatomy of a Great Prompt

Every well-structured prompt should consider these components (not all are required for every prompt):

```
[PERSONA/ROLE]     — Who should the AI be?
[TASK]             — What should the AI do?
[CONTEXT]          — What background info does the AI need?
[FORMAT]           — How should the output be structured?
[CONSTRAINTS]      — What limits should be applied? (length, tone, things to avoid)
[REFERENCES]       — Any examples or samples to guide the output?
[STOP CONDITION]   — When should the interaction end? (for agents)
```

### 3.2 Formatting Controls

You can control virtually any aspect of AI output formatting:

| Format Type | How to Request |
|-------------|---------------|
| **Tables** | "Organize the data into a table with columns: X, Y, Z" |
| **Bullet points** | "Use bullet points, each no longer than 10 words" |
| **Numbered lists** | "Provide a numbered list of steps" |
| **Checklists** | "Create a checklist for..." |
| **JSON** | "Output valid JSON only. Use this schema: {...}" |
| **Specific length** | "Keep it under 150 words" / "Exactly 3 bullet points" |
| **Structured sections** | "Include a one-paragraph recommendation for X and another for Y" |

### 3.3 Delimiters for Clarity

Use delimiters to separate instructions from content:

```
Here are your instructions:
[instructions here]

---

Here is the content to work with:
[content here]
```

This makes it clear what the AI should treat as instructions versus input data.

### 3.4 Structured Output (JSON Schema)

When you need machine-parseable output, provide an exact schema:

```
Compare Trello, Monday.com, and ClickUp for a small team of 5-10 people.
Output valid JSON only. No other text.

Example format:
{
  "tools": [
    {
      "name": "...",
      "features": ["..."],
      "limitations": ["..."],
      "pricing": "..."
    }
  ]
}
```

This is critical for development workflows where AI output feeds into APIs, databases, or front-end displays.

---

## 4. Advanced Techniques

### 4.1 Zero-Shot Prompting

**What it is:** Asking the model to perform a task without any examples, relying entirely on its pre-trained knowledge.

**When to use:** Simple, well-defined tasks where the model already has sufficient training data (e.g., factual questions, standard formats).

**Example:**
```
When is Christmas in America?
```

The model already knows this — no examples needed.

### 4.2 Few-Shot Prompting

**What it is:** Providing a small number of input/output examples so the model can infer the pattern and replicate it.

**When to use:** When you want a specific format, style, or classification behavior. When zero-shot results are inconsistent or wrong. Especially powerful for classification tasks.

**Example:**
```
Turn user feedback into a short ticket title (under 60 characters).
Format: [Area] Brief description

Examples:
- Feedback: "Login is broken with Google on Safari" → Title: "[Auth] Google login fails on Safari"
- Feedback: "Export to CSV only exports first 100 rows" → Title: "[Export] CSV limited to 100 rows"

Now generate a title for:
Feedback: "The app crashed when I uploaded a PDF over 10MB on iPhone"
```

**Result:** `[Upload] iPhone app crashes on PDFs over 10MB`

**Key insight:** Few-shot prompting is essentially what fine-tuning does at a larger scale. You pass input/output pairs so the model can infer the pattern.

### 4.3 Chain of Thought (CoT) Prompting

**What it is:** Asking the model to explain its reasoning step by step before giving the final answer. Similar to how a math teacher asks you to "show your work."

**When to use:** Math problems, logic tasks, planning, comparisons, complex decision-making. Any time you want to reduce errors by making reasoning transparent.

**How to activate:** Add phrases like:
- "Explain your thought process"
- "Walk me through your reasoning step by step"
- "Show me your complete thought process before giving your final recommendation"
- "Think step by step"

**Example:**
```
A store sells pens for $2 and notebooks for $5.
Sarah buys 3 pens and 2 notebooks. She has a 10% off coupon.
How much does she pay?

Walk me through your reasoning step by step before giving the final answer.
```

**Note:** Many modern reasoning models (GPT-4o, Claude, etc.) do chain-of-thought internally by default. But explicitly requesting it can still improve results, especially with API usage or older models.

### 4.4 Tree of Thought (ToT) Prompting

**What it is:** Exploring multiple reasoning paths simultaneously, like branches of a tree. Multiple "experts" each propose a solution path, evaluate, and the best one is selected.

**When to use:** Abstract or complex problems, creative work, developing novel plots, creating outlines, brainstorming designs.

**Example:**
```
Imagine three different designers are pitching their designs to me.
All designers will write down one step of their thinking, then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they're wrong at any point, they leave.

The question is: Generate an image that's visually energetic and features images of
art supplies and computers. Show me three suggestions in very different styles,
from simple to detailed and complex.
```

**Pro tip:** Combine Chain of Thought + Tree of Thought by asking the AI to explain its reasoning at each iteration so you can provide feedback.

### 4.5 Prompt Chaining

**What it is:** Breaking a complex task into a series of interconnected prompts, where each prompt builds on the output of the previous one.

**When to use:** Complex, multi-step projects. When you want to verify each step before proceeding. When a single prompt would be too complex.

**Example flow:**
```
Step 1: "Generate three options for a one-sentence summary of this novel manuscript."
Step 2: "Create a tagline combining the best elements of those three options,
         with a special focus on the exciting plot twist."
Step 3: "Develop a 6-week promotional plan for the book tour based on that tagline."
```

**Why it works:** Each step is simpler and more focused, producing better results than asking for everything at once. You can verify and redirect at each step.

### 4.6 Meta Prompting

**What it is:** Using AI to help you write better prompts. When you're stuck and don't know what prompt to use, ask the AI to generate one for you.

**When to use:** When you don't know how to phrase your request. When you want to improve an existing prompt.

**Example:**
```
I want to create a prompt that will help me write a marketing plan
for a new SaaS product. What would be the most effective prompt structure
to get comprehensive, actionable results?
```

### 4.7 Interview-Style Prompting

**What it is:** Instead of guessing what context to provide, give the model the task and ask it to interview you for the information it needs.

**When to use:** When you don't know what information the model needs. When you tend to leave out important details. For complex, context-heavy tasks.

**Why it works:** We often leave out details — audience, constraints, format, examples — because we don't know the model needs them. The interview surfaces information you wouldn't think to include.

**Example:**
```
I need a short LinkedIn post (about 250 words) about lessons we learned
switching to a 4-day work week.

Before you write it, interview me. Ask me questions about anything you need —
audience, company size, tone, metrics, dos and don'ts.
Ask one question at a time.
When you have enough information, say "I have enough" and give me the post.
```

### 4.8 Self-Evaluation / Self-Critique

**What it is:** Asking the model to critique, score, or evaluate its own output (or output presented as someone else's).

**When to use:** To improve drafts, code, summaries. As a quality check before using AI-generated content.

**Pro tip:** Start a new session and present the output as your own work ("Here's a summary I wrote...") rather than asking the model to critique itself in the same conversation. This reduces self-serving bias.

**Example:**
```
Here's a short summary I wrote:
[paste AI-generated text]

Rate it 1-5 for clarity and completeness.
In one sentence, suggest the single most important improvement.
```

### 4.9 Perspective Switching

**What it is:** Forcing the model to examine an issue from multiple distinct viewpoints, then synthesize insights.

**When to use:** Decision-making, comprehensive analysis, avoiding tunnel vision.

**Example:**
```
I'm considering pivoting my consulting business from general business consulting
to AI implementation specifically.

Analyze this decision from three perspectives:
1. As a conservative CFO focused on financial risk
2. As an aggressive growth strategist focused on market opportunity
3. As a cautious operations manager focused on execution challenges

After all three analyses, synthesize the insights into actionable recommendations.
```

### 4.10 Style Mirroring

**What it is:** Teaching the AI to write in your exact style by providing samples of your writing.

**When to use:** Business communications, brand voice consistency, personal writing.

**Example:**
```
Analyze the writing style in this email I wrote:
[paste your email]

Now, write a follow-up email to the same client about project delays,
matching my tone, sentence structure, and communication approach exactly.
```

### 4.11 Nested Complexity

**What it is:** Creating prompts within prompts that handle complex, multi-layered requests at different levels of detail.

**When to use:** Comprehensive strategy documents, detailed plans, multi-level deliverables.

**Example:**
```
Create a content marketing strategy for a B2B software company.
Structure your response in three nested levels:

Level 1: Overall strategy and goals
Level 2: Monthly themes and content pillars
Level 3: Specific content pieces for month one, including blog topics,
         social media posts, and email sequences

For each content piece, provide: title, target audience, key points, distribution channels.
```

### 4.12 System Prompts vs. User Prompts

**What it is:** System prompts set the persistent identity, rules, and style of the model. User prompts are the individual requests.

**When to use:** System prompts are for "always-on" behavior. User prompts are for specific tasks.

**Developer note:** In API settings, system prompts are set once and persist across the conversation. In ChatGPT, "Custom Instructions" function similarly. In tools like Cursor, system prompts are automatically injected.

**Example:**
```
System prompt: "You are a helpful coding assistant. Always provide code examples
in Python unless asked otherwise. Use type hints. Include docstrings."

User prompt: "How do I read the first line of a file?"
```

### 4.13 Temperature and Model Parameters

**What it is:** Temperature controls the determinism (repeatability) of model output.

| Temperature | Behavior | Use for |
|------------|----------|---------|
| **Low (0.0–0.3)** | More repeatable, consistent, focused | Structured output, code, facts, classification, format-sensitive tasks |
| **High (0.7–1.0)** | More creative, varied, random | Brainstorming, varied phrasing, creative writing, generating multiple ideas |

**Rule of thumb:** If outputs are too random, lower the temperature. If too repetitive, raise it slightly.

---

## 5. Use Case Specific Tips

### 5.1 Email Writing

- Specify the tone precisely: instead of "casual," say "friendly, easy-to-understand, like explaining to a curious friend"
- Provide references of your past emails for style matching
- Always specify length constraints ("keep it under 150 words")
- For important emails, use the style mirroring technique

**Template:**
```
I'm a [role] at [company]. Write an email to [recipient] about [topic].
The email should be [tone]. [Specific requirements].
Keep it under [word count] words. Avoid [things to avoid].
```

### 5.2 Coding

- Always specify the programming language
- Specify the data structures involved ("an array of objects," not just "data")
- Ask the AI to explain each code snippet so you learn, not just copy-paste
- Use chain-of-thought for debugging: "Walk me through what this code does step by step"

### 5.3 Summarization

- Never just say "summarize this" — specify the format (bullet points, paragraph, table)
- Set word limits per point ("each point no longer than 10 words")
- Specify what to focus on and what to ignore
- Request a conclusion or recommendation at the end

### 5.4 Data Analysis

- Be cautious about what data you input (privacy, sensitivity)
- Ask the AI to teach you how to do things in spreadsheets, not just give answers
- Ask for insights about relationships between variables
- Follow up on interesting findings by digging deeper

### 5.5 Content Generation

- Use persona + style references for high-quality output
- Specify the audience, platform, and purpose
- For social media, include the image/context as a reference
- Use analogous tasks for more creative results (e.g., "tell a story" instead of "write a marketing plan")

### 5.6 Presentations

- Ask AI to generate slide outlines first, then expand
- Specify the number of slides, key points per slide, and visual suggestions

### 5.7 Data Extraction & Transformation

- Use short prompts — these are rigid, black-and-white tasks
- Cheaper models work fine here
- Provide clear rules: "Only output the full name. No explanation."
- Include input/output examples for the exact format you need

### 5.8 Classification Tasks

- LLMs are excellent at classification — but only with examples
- Simple cases: short prompts work
- Subjective cases: use long prompts with clear rules and examples
- Few-shot prompting is ideal for classification

### 5.9 Decision-Making & Evaluation

- Always use long prompts with the best models
- Use perspective switching for balanced analysis
- Use chain-of-thought to make reasoning transparent
- Request a decision framework, not just a recommendation

---

## 6. Common Mistakes to Avoid

### 6.1 Being Too Vague

**Problem:** Generic, irrelevant output.
**Fix:** Add role, audience, tone, format, and length.

```
Bad:  "Write me a blog post about marketing."
Good: "You are an experienced marketing strategist. Write a 1,000-word blog post
      about email marketing for small businesses. Include specific tactics.
      Avoid generic advice. Format with clear subheadings and bullet points."
```

### 6.2 Too Many Tasks in One Prompt

**Problem:** The model misses something, mixes tasks up, or produces shallow results.
**Fix:** Split into separate prompts or use prompt chaining. One task per prompt.

### 6.3 Not Enough Context or Examples

**Problem:** Wrong format, wrong style, wrong assumptions.
**Fix:** Add 1–3 shot examples with input/output pairs. Include relevant background. Use the interview technique to surface needed context.

### 6.4 Assuming the AI Has Memory

**Problem:** The model forgets things from earlier in long conversations or across sessions.
**Fix:** Repeat or summarize key facts if the thread is long. Don't assume the model remembers — it only knows what's in its current context window.

### 6.5 Leading the Answer

**Problem:** Biased responses that just confirm what you implied.
**Fix:** Ask neutral questions. Don't embed the expected answer in your prompt.

### 6.6 Ignoring Format Specification

**Problem:** Output is hard to parse or reuse.
**Fix:** Explicitly request a specific structure. Tell the model to ONLY output that format. "Valid JSON only. No other text."

### 6.7 Starting with a Massive Prompt (Proactive Prompting)

**Problem:** Hard to debug, high cost, missed edge cases, unclear what drives behavior.
**Fix:** Start simple. Build reactively. Add one instruction at a time when specific errors appear.

### 6.8 Making the AI a "Jack of All Trades"

**Problem:** Unreliable, inconsistent behavior when one agent tries to do everything.
**Fix:** Single task per prompt/agent. Delegate specialized work to tools or sub-agents.

### 6.9 Not Using Negative Instructions

**Problem:** Generic, cliche-filled, or off-tone responses.
**Fix:** Explicitly state what to avoid. "Do not use slang. Do not apologize. Do not suggest paid tools. Do not include code — describe the approach only."

### 6.10 Letting the AI Choose Everything

**Problem:** You get whatever the model defaults to — often too long, too generic, wrong format.
**Fix:** Control formatting, length, tone, and structure explicitly. Professional prompting means controlling every aspect of the output.

---

## 7. Prompt Templates

### 7.1 General-Purpose Task Template

```
You are a [ROLE] with expertise in [DOMAIN].

[TASK]: [Clear description of what you want]

Context:
- [Background info 1]
- [Background info 2]

Requirements:
- Format: [table / bullet points / JSON / paragraph]
- Length: [word count / number of items]
- Tone: [professional / casual / technical / conversational]
- Audience: [who will read this]

Constraints:
- Do NOT [thing to avoid 1]
- Do NOT [thing to avoid 2]
- Keep it under [X] words

[Optional: Reference examples or attachments]
```

### 7.2 Few-Shot Classification Template

```
Classify the following [items] into categories: [Category A], [Category B], [Category C].

Examples:
- Input: "[example 1]" → Category: [A]
- Input: "[example 2]" → Category: [B]
- Input: "[example 3]" → Category: [C]

Now classify:
- Input: "[new item]" → Category:
```

### 7.3 Interview-Style Template

```
I need [output type] about [topic].

Before you begin, interview me to gather all the information you need.
Ask about: [audience, constraints, tone, format, context, examples, dos/don'ts].
Ask one question at a time.
When you have enough information, say "I have enough" and produce the [output type].
```

### 7.4 AI Agent System Prompt Template

```markdown
# Role
You are a world-class [role] with particular expertise in [domain].
You coordinate a team of specialized sub-agents: [list sub-agents].

# Objective
Your goal is to [clear goal statement].
Think step by step to ensure thorough and accurate task management.

Key responsibilities:
1. Decide which sub-agents to delegate tasks to
2. Communicate clearly what needs to be done with all relevant details
3. Communicate results or outstanding questions back to the user

# Context
[Why this task matters. What triggers the agent. Stakes involved.]
It is vital to the user's productivity and success that you perform your job
meticulously and accurately.

# SOP (Standard Operating Procedure)
It is vital that you always think step by step through the following process:
1. Parse the request and identify the task type
2. Decide which sub-agents or tools to use
3. Communicate detailed, precise instructions to chosen sub-agents
4. If required details are missing, ask the user before proceeding
5. Execute the task
6. Report back clearly with results or next steps

# Instructions & Rules
- Always confirm [critical details] before proceeding
- Never assume missing details — ask for clarification
- [Additional constraints]

# Sub-Agents & Tools
## [Sub-agent 1 Name]
- Purpose: [what it does]
- When to use: [trigger conditions]
- How to communicate: [format]
- Expected output: [what it returns]

## [Sub-agent 2 Name]
[same structure]

# Examples
**Example 1:**
- Input: "[user request]"
- Actions: [what the agent should do]
- Output: "[expected response to user]"

# Notes
- It is vital that you always perform tasks meticulously
- If something is unclear, always ask before proceeding
- Think step by step for every action
- Ensure all confirmations are short, clear, and professional
```

### 7.5 Simulation Agent (Agent Sim) Template

```
Persona: Act as a [role/character for the simulation].

Task: Your task is to [simulation objective].

Context: You need to support the following types of interactions:
- [Interaction type 1]
- [Interaction type 2]
- [Interaction type 3]

Once the user picks a topic, provide details about the situation and act as [role].
Allow the user to participate as [their role].
Guide the conversation so the user can exercise [target skills].

Stop Rule: Continue the roleplay until the user replies with "[stop phrase]".
After the stop phrase, provide:
- Key takeaways from the simulation
- Skills to work on
- Areas of improvement
```

### 7.6 Expert Feedback Agent (Agent X) Template

```
Persona: You're my [expert role, e.g., "potential client, the VP of Advertising
at a sports car company known for innovation and performance"].

Context: [Situation setup — meeting type, what you're pitching, etc.]

Task: Act as my [role]. When I provide answers:
- Critique the answers if needed
- Ask follow-up questions
- Challenge my points with realistic objections

Continue the conversation until I give the stop role: "[stop phrase]".
Then give me a summary of the whole conversation, highlighting ways I can improve.

References: [Attach relevant briefs, documents, or background materials]
```

### 7.7 Step-by-Step Consultant Template

```
I want to [goal].

Walk me through this step by step:
1. First, help me with [step 1]. Wait for my response before moving to step 2.
2. Then, we'll work on [step 2].
3. Then, [step 3].
4. Then, [step 4].

Ask clarifying questions at each step.
```

### 7.8 Comparison Template

```
Create a comparison between [Option A], [Option B], and [Option C] for [use case].

Format your response as a table with these columns:
[Feature], [Option A], [Option B], [Option C], [Winner].

Include [N] key comparison points.
After the table, provide a one-paragraph recommendation for [audience 1]
and another for [audience 2].
```

### 7.9 Out-of-Office / Constrained Email Template

```
Write a short out-of-office reply.
Start with the exact dates I'm away and one sentence on who to contact for urgent issues.
Do NOT use the phrase "limited access."
Do NOT say "reply when I can" or "thank you for your patience."
Be short, to the point, but detailed enough that people understand when I'm coming back.

I'm going to be away from [start date] to [end date].
Contact [name] at [email] for urgent issues.
```

---

## 8. Key Takeaways

### The 15 Most Important Insights Across All 5 Courses

1. **Specificity is the #1 lever.** The gap between a bad prompt and a great prompt is almost entirely about how specific you are — not how long the prompt is.

2. **Use the TCREI framework for every prompt.** Task, Context, References, Evaluate, Iterate. It's the foundation everything else builds on.

3. **Steer, don't command.** Define the role, audience, tone, and format. Don't let the model choose these for you.

4. **Negative instructions are surprisingly powerful.** Telling the AI what NOT to do often produces better results than telling it what to do.

5. **Prompt chaining beats mega-prompts.** Break complex tasks into steps. Verify each step before moving to the next. This almost always produces better, more consistent results.

6. **Interview-style prompting surfaces context you'd never think to include.** Let the model ask you questions before it begins the task.

7. **Few-shot examples are the fastest way to get consistent format.** 2–3 input/output pairs are usually enough for the model to infer the pattern.

8. **For AI agents, think of them as interns.** They need clear, step-by-step instructions (SOPs) that remove any possibility for misinterpretation. Their job is decision-making and delegation, not doing everything themselves.

9. **Start simple, iterate reactively.** Don't write a massive prompt upfront. Start minimal, test, and add instructions only when specific errors appear.

10. **LLMs weight the beginning and end of prompts most heavily.** Put critical instructions at the start and important reminders in a "Notes" section at the end.

11. **Context window matters.** Your prompt is rarely the only thing the LLM sees. Tools inject system prompts, conversation history, and tool descriptions behind the scenes. Understand what's going into the full context.

12. **Save your best prompts.** Build a personal prompt library for your most common tasks rather than starting from scratch each time.

13. **Use structured output (JSON schemas) for machine-parseable results.** This is critical for any developer or automation workflow.

14. **Self-evaluation in a fresh session produces more honest critique.** Present AI output as your own work in a new conversation for unbiased feedback.

15. **Speak your prompts instead of typing them.** Voice dictation tools let you create much longer, more detailed prompts without the laziness that comes with typing. The more detail you include, the better the result — and speaking removes the friction.

### Useful Phrases That Improve Output Quality

| Phrase | Effect |
|--------|--------|
| "You are a world-class [X]" | Significantly improves response quality |
| "It is vital to my career that..." | Emotional emphasis that produces more careful output |
| "Think step by step" | Activates more thoughtful, careful reasoning |
| "Explain your thought process" | Makes reasoning transparent and catches errors |
| "Important:" / "IMPORTANT:" | Highlights critical instructions |
| "Do NOT..." | Prevents common unwanted behaviors |
| "Only output [format]. No other text." | Ensures clean, parseable output |
| "Wait for my response before proceeding" | Prevents the AI from rushing through multi-step tasks |
| "Ask me clarifying questions if anything is unclear" | Surfaces missing context |

---

## Sources

| Video | Title / Instructor | Link |
|-------|--------------------|------|
| 1 | Google's Prompt Engineering Course (Cliffnotes) | [youtube.com/watch?v=p09yRj47kNM](https://youtube.com/watch?v=p09yRj47kNM) |
| 2 | Prompt Engineering Course — Anu Kubo / FreeCodeCamp | [youtube.com/watch?v=_ZvnD73m40o](https://youtube.com/watch?v=_ZvnD73m40o) |
| 3 | Prompt Engineering: Core Techniques & Advanced Strategies — Tim | [youtube.com/watch?v=2BpCk4d2Cc0](https://youtube.com/watch?v=2BpCk4d2Cc0) |
| 4 | 21 Prompts: Beginner to Expert — AI Master Pro | [youtube.com/watch?v=qBlX6FhDm2E](https://youtube.com/watch?v=qBlX6FhDm2E) |
| 5 | Prompt Engineering for AI Agents | [youtube.com/watch?v=twuZ5t-5O94](https://youtube.com/watch?v=twuZ5t-5O94) |
