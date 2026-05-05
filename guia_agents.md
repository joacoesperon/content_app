# GUIA 

I want to build an AI agent today (full course):
No-one has made a full course so that anyone (yes, you) can create an AI agent from scratch.
If you wanted to, you could read this article and create an agent that is useful for you to utilise today, because creating an agent for agents sake means nothing, it needs to be for a reason.
So what did I do?
I took resources from Anthropic, OpenAI, and other experts on the internet who have given bits of information that is useful here and there, I took them all, put it together with my mate Claude, and created a full course for the layman (me) to understand so that we (me and you) can create an agent today.
This is a long article, at the end of it, you will be able to build your first agent, just so to help you navigate this article the text that is CAPITALISED AND BOLD are the subheadings, there's 8 in total, each one will have an image so you can get to each part you want to:
How agents work
Five workflows
Building your agent
Utilising tools
Giving your agent memory
Making your agent work
Multiple agents
Wrapping it all up
Okay, let's get straight into it here...
1: HOW AGENTS WORK
It's important to know this stuff, if you don't then you'll have no idea why you'll need one or not... so...
This is the core loop shared by all agents:
User input → LLM thinks → LLM decides (respond or call a tool) → if tool: execute it, feed result back → repeat
The LLM is the “brain” that reasons.  Tools are the “hands” that perform actions (calculator, web search, file I/O). Memory is the “notepad” that records what has happened so far. Whether you use LangGraph, CrewAI, Anthropic’s SDK or OpenAI’s Agents SDK, the frameworks wrap this loop with abstractions but do not change its essence.
Augmented LLMs
A plain LLM accepts text and emits text. An augmented LLM adds three capabilities:
Tools: functions the model can call (calculators, databases, APIs, file operations, etc.). Anthropic and OpenAI expose tools via JSON schemas; Anthropic passes an input_schema while OpenAI wraps functions in a function object with parameters
Retrieval: ability to pull relevant information from external sources (search engines, documents, vector databases).
Memory: ability to retain information across interactions via a message history or other persistent storage.
Workflows vs. true agents
The distinction between workflows and agents matters when choosing an approach. Workflows are deterministic; your code controls execution and the same input always produces the same path. They are ideal for well‑defined tasks with fixed steps and are cheaper (fewer LLM calls). Agents are dynamic; the LLM decides the next step and may call tools repeatedly. They are best for open‑ended tasks but cost more. The process for you finding if you need to create an agent or not should start by using a simple workflow and then seeing whether or not you'll graduate that to become an autonomous agent.
2: THE FIVE CORE WORKFLOW PATTERNS
Because believe it or not, most problems can actually be solved without needing full autonomy. These five patterns, documented by Anthropic and widely adopted, cover common cases. Each pattern relies on an augmented LLM.
Pattern 1: Prompt chaining
What it is: Break a task into sequential steps. Each LLM call processes the output of the previous one. Add programmatic "gates" between steps to verify quality.
When to use it: Tasks that decompose cleanly into fixed subtasks. You trade speed for accuracy by making each LLM call simpler.
Example use cases: Generate marketing copy then translate it. Write an outline, verify it covers key topics, then write the full document.
Pattern 2: Routing
What it is: Classify incoming input, then route it to a specialised handler. Each handler gets its own optimised prompt.
When to use it: Different categories of input need fundamentally different treatment. Customer service triage is the classic example.
Pattern 3: Parallelisation
What it is: Run multiple LLM calls simultaneously. Sectioning splits a task into independent subtasks processed in parallel. Voting runs the same task multiple times and aggregates results for higher confidence.
When to use it: When subtasks are independent (sectioning) or when you need consensus on a critical decision (voting).
Pattern 4: Orchestrator-workers
What it is: A central LLM (the orchestrator) dynamically breaks down a task and delegates subtasks to worker LLMs. Unlike parallelisation, the subtasks are not predefined, the orchestrator decides them at runtime.
When to use it: Complex tasks where you cannot predict the structure in advance. Code generation across multiple files, research tasks, and report writing.
Pattern 5: Evaluator-optimiser
What it is: One LLM generates output, another evaluates it and provides feedback. If evaluation fails, the feedback loops back. This repeats until quality criteria are met.
When to use it: When clear evaluation criteria exist and iterative refinement adds measurable value. Translation, code generation, and writing tasks.
3: BUILDING YOUR AGENT
This is the part of the article you came for... let's dive in:
So how do you turn "I want an agent to do XYZ" into something real?
The easiest way to think about it is this:
Write down the job
Decide what tools it needs
Tell the model how to behave
Test it on 5 real examples
Only add more complexity if it fails
You do not need to master five frameworks to build your first agent. For me and you the best starting point is:
Anthropic if you want an agent that works like a capable operator with tools, files, shell commands, web actions, and strong coding workflows
OpenAI if you want a clean developer SDK with hosted tools, handoffs, guardrails, and a simple path to production
This guide focuses mainly on those two.
The simplest mental model 
When building an agent, answer these four questions first:
1. What is the outcome?
What should the agent actually produce?
Examples:
“Research a topic and write a summary”
“Read my notes and turn them into flashcards”
“Look at support requests and route them correctly”
“Compare products and give me the best option”
“Review my content and rewrite it in my voice”
2. What information does it need?
Does it need web search, files, a database, a spreadsheet, a CRM, or just the user’s message?
3. What actions should it be allowed to take?
Can it only answer?
Can it search?
Can it edit files?
Can it send emails?
Can it write code?
Can it call your own functions?
4. What rules must it follow?
Tone, format, constraints, safety rules, what to do when uncertain, and what “good” looks like.
If you can answer those four questions clearly, you can usually build the first version of your agent in a day.
Quick hack we'll dive into shortly, you can take your idea, give it to your LLM, ask it to think deeply, let it answer all the above questions for you.
How to use AI itself to design the agent before you build it
A very practical move is to use Claude or ChatGPT before coding to help you define the agent.
Paste something like this:
markdown
I want to build an AI agent.

My goal:
[describe what you want it to do]

The user will ask things like:
[add 5 realistic examples]

The agent should have access to:
[web search / files / calculator / custom API / nothing else]

It must always:
[list non-negotiable rules]

It must never:
[list boundaries]

Please turn this into:
1. A clear agent spec
2. A system prompt
3. A tool list
4. A first version roadmap
5. 10 test cases
That one prompt can help a beginner turn a vague idea into a buildable plan.
A beginner-friendly formula for agent design
Use this structure every time:
Agent = Role + Goal + Tools + Rules + Output format
Example:
Role: Research assistant for crypto projects
Goal: Find accurate information and summarise it clearly
Tools: Web search, file search, calculator
Rules: Cite sources, do not guess, flag uncertainty
Output format: Summary, risks, opportunities, final verdict
That is the foundation of most useful agents.
Start with one of these five beginner agent types:
If you are new, do not start by building a multi-agent swarm. Start with one of these:
1. Research agent
Use when you want the agent to gather information and summarise it.
Examples:
“Research the best rehab exercises for ankle sprain”
“Find the latest updates on a crypto protocol”
“Compare three laptops”
Needs:
Web search
File search if you want it to use your own documents
Clear output format
2. Content agent
Use when you want the agent to write, rewrite, summarise, or transform content.
Examples:
“Turn my notes into a newsletter”
“Rewrite this in my brand voice”
“Summarise this meeting transcript”
Needs:
Usually just a strong system prompt
Optional file access
Examples of your preferred style
3. Workflow agent
Use when you want the agent to follow a repeatable business process.
Examples:
“Classify support tickets”
“Route leads to the right category”
“Check form submissions and create a response draft”
Needs:
Clear categories
Rules
Sometimes custom tools or API calls
4. Personal knowledge agent
Use when you want the agent to answer questions using your documents.
Examples:
“Answer using my PDFs only”
“Search my notes and explain this topic”
“Find all references to this client”
Needs:
File search or RAG
Clear instruction to stay grounded in provided material
5. Operator agent
Use when you want the agent to take actions in an environment.
Examples:
“Read these files and edit them”
“Search the web, gather findings, and save a report”
“Run shell commands and help me debug code”
Needs:
Tools
Permissions
Strong safety boundaries
Anthropic: the easiest way to think about building your first agent
Anthropic’s agent tooling is especially helpful when you want the model to use tools and operate in an environment. Claude Code launched in February 2025, and the Claude Code SDK was later renamed the Claude Agent SDK in September 2025. The current GitHub release listed in March 2026 is v0.1.50.
When Anthropic is a good choice
Choose Anthropic first if you want an agent that should:
read, write, and edit files
use shell commands
search the web
use MCP tools
work well for coding and technical tasks
feel like a capable assistant operating step by step
What you are really doing with Anthropic
At a beginner level, you are doing three things:
Giving Claude a job
Giving Claude tools
Letting Claude loop until the task is done
That is all.
Beginner example: a research-and-summary agent
Let’s say you want:
“An agent that researches a topic and writes me a clean report.”
Your build plan would be:
Role: Senior research assistant
Goal: Find accurate information and summarise it clearly
Tools: Web search, maybe file access
Rules: Cite sources, say when uncertain, keep it concise
Output: Bullet summary + key risks + conclusion
That becomes your system prompt:
python
SYSTEM_PROMPT = '''
You are a careful research assistant.

Your job is to help the user research topics accurately.
Use tools when needed.
Do not guess.
If information is uncertain or incomplete, say so clearly.
Always produce:
1. Summary
2. Key findings
3. Risks or uncertainty
4. Final conclusion
'''
Now the user can ask:
“Research the latest AI agent SDKs”
“Compare Anthropic and OpenAI for building a beginner agent”
“Find three strong sources and summarise them”
That is already a real agent.
Beginner example: a file-based writing agent
Maybe you want:
“Read my notes and rewrite them into a clean article in my voice.”
Then your design becomes:
Role: Writing assistant
Goal: Turn rough notes into polished writing
Tools: File read, maybe file write
Rules: Preserve meaning, improve clarity, match tone
Output: Final article + optional title ideas
That is much easier to build than a vague “content agent”.
What you should ask AI before building the Anthropic agent:
Use your LLM to help you define the build:
markdown
Help me design an Anthropic agent.

My goal is:
[goal]

I want the agent to be able to:
[list actions]

I want the agent to use these tools:
[list tools]

I want the final output to look like:
[format]

Please create:
1. A strong system prompt
2. A minimal tool list
3. A first version Python example
4. 10 test prompts
5. Suggestions to improve reliability
That prompt will usually get you 80% of the way there.
OpenAI: the easiest way to think about building your first agent
OpenAI launched its Agents SDK on 11 March 2025 alongside the Responses API and built-in tools for web search, file search, and computer use. The Python package openai-agents was at version 0.13.1 in March 2026.
When OpenAI is a good choice
Choose OpenAI first if you want:
a very clean agent API
easy custom function tools
built-in hosted tools
handoffs between specialist agents
guardrails and tracing
a smooth path from prototype to production
What you are really doing with OpenAI
At a beginner level, the build is:
Create an Agent
Give it instructions
Add tools if needed
Run it with a real user request
That is it.
Beginner example: a support triage agent
Suppose your goal is:
“Read incoming support requests and decide whether they are billing, technical, or sales.”
That becomes:
Role: Support triage assistant
Goal: Categorise requests correctly
Tools: None, maybe later a CRM tool
Rules: Choose one category only, explain briefly
Output: Category + reason
This would look like this:
python
from agents import Agent, Runner

agent = Agent(
    name="Support Triage Agent",
    instructions=\"\"\"
You classify customer requests.
Choose exactly one category:
- billing
- technical
- sales

Reply with:
1. Category
2. One sentence explaining why
\"\"\",
)

result = Runner.run_sync(agent, "I was charged twice for my subscription this month.")
print(result.final_output)
That is already a useful agent.
Beginner example: adding a custom tool
Now suppose you want:
“Calculate values for the user when needed.”
python
from agents import Agent, Runner, function_tool

@function_tool
def calculate(expression: str) -> str:
    import math
    allowed = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
    return str(eval(expression, {"__builtins__": {}}, allowed))

agent = Agent(
    name="Math Helper",
    instructions="Help the user solve maths problems. Use the calculator tool when needed.",
    tools=[calculate],
)

result = Runner.run_sync(agent, "What is compound growth on 10000 at 5 percent for 8 years?")
print(result.final_output)
Now the agent is not just chatting. It is taking actions through a tool.
Beginner example: using hosted tools
The OpenAI Agents SDK also supports hosted tools like web search, file search, and code interpreter through helper functions in the SDK docs. A beginner can think of these as “prebuilt capabilities” you attach to the agent instead of writing everything from scratch.
That means you can build agents like:
“Research this topic from the web and summarise it”
“Search my files and answer from them”
“Run code to analyse this data”
What you should ask your LLM before building the OpenAI agent:
markdown
Help me design an OpenAI agent.

My goal:
[goal]

The tasks I want it to handle:
[list tasks]

The tools I think it needs:
[list tools]

The output should look like:
[format]

Please give me:
1. A clear agent instruction block
2. The simplest first version
3. A version with tools if needed
4. 10 test prompts
5. Common failure modes and how to fix them
How to customise your agent so it actually does what you want
This is where beginners usually go wrong. They build a generic assistant instead of a specific agent.
Use this checklist.
1. Make the job narrow
Bad:
“Help with business stuff”
Good:
“Summarise sales calls into action points”
“Categorise leads into hot, warm, cold”
“Research crypto projects and output risks, catalysts, and verdict”
2. Define the output format
Bad:
“Give me an answer”
Good:
“Return: Summary, evidence, risks, next steps”
“Return JSON with category, confidence, explanation”
“Return a bullet list under 5 headings”
3. Give examples
If you want tone, structure, or classification quality, examples help a lot.
Tell the model:
“Here are 3 examples of good outputs”
“Here are 5 examples of how to classify requests”
“Write in this exact style”
4. Add tools only when needed
Do not add web search if the task is just rewriting notes.
Do not add file access if the answer should come from the prompt alone.
Every extra tool adds complexity.
5. Test with real prompts, not ideal ones
Use messy prompts like a real user would type.
Instead of testing only:
“Please classify this technical issue”
Also test:
“my account is broken and i keep getting charged what do i do”
That is where you learn what your agent actually does.
Here's your build path:
Step 1: Write one sentence describing the agent
Example: “I want an agent that turns my rough notes into a clean weekly newsletter.”
Step 2: Ask Claude or ChatGPT to turn that into:
an agent spec
a system prompt
a tool list
10 test prompts
Step 3: Build the smallest working version
No multi-agent setup. No complex memory. No RAG unless needed.
Step 4: Test it on 10 real examples
Step 5: Improve one thing at a time
prompt
output structure
examples
tools
memory
retrieval
That order matters. Don't get bogged down by it all.
Avoid this mistake:
The biggest mistake is trying to build an “all-purpose super agent”.
Do not start with:
web search
file search
database access
memory
multi-agent handoffs
complex guardrails
custom dashboards
20 tools
Start with:
one job
one agent
one clear prompt
one or two tools maximum
five to ten real test cases
This is how you will succeed, by not overcomplicating it for yourself.
Practical takeaway:
You're at the end of part 3 now, this was the section that is teaching you how to build your first agent, at the end of this section you should be able to say:
I know what my agent is for
I know what tools it needs
I know what rules it should follow
I know how the output should look
I know whether to start with Anthropic or OpenAI
I know how to use AI itself to help me design the first version
4: UTILISING TOOLS
Most people get this wrong.
They think:
“More tools = smarter agent”
Wrong.
Better tools = smarter agent.
Fewer tools = more reliable agent.
The simplest way to think about tools
A tool is just:
“Something the AI can’t do on its own”
Examples:
calculate numbers
search the web
read your files
send an email
query a database
Step 1: Ask yourself: "Does this need a tool?"
Before adding anything, ask:
Can the model answer this using just reasoning?
Or does it need real-world data or actions?
Example:
No tool needed:
“Rewrite this email”
“Summarise this text”
“Explain this concept”
Tool needed:
“What’s the weather right now?”
“Search the latest news”
“Calculate compound interest”
“Pull data from my spreadsheet”
👉 Rule:
If it requires external data or action → use a tool
If not → don’t add one
Step 2: Use AI to help you with your tools:
markdown
I am building an AI agent.

My goal:
[describe goal]

Here is what I think the agent needs to do:
[list actions]

Which of these require tools?
What tools should I create?
Keep them simple and minimal.

Return:
1. Tool list
2. Tool descriptions
3. Inputs required for each tool
This will save you a lot of time.
Step 3: Keep it simple stupid
Bad tool:
python
manage_files(action, file, destination, overwrite, format, permissions)
Good tools:
python
read_file(path)
write_file(path, content)
delete_file(path)
👉 Rule:
One tool = one clear job
Step 4: Tell the agent WHEN to use the tool
This is where most people fail.
Bad:
“Calculator tool”
Good:
“Use this tool whenever maths is required. Never guess calculations.”
Step 5: Let the agent fail and fix it
Run real tests like:
“what’s 2^16”
“calculate 7% growth over 10 years”
If it:
doesn’t use the tool → fix description
uses it incorrectly → fix inputs
hallucinates → make rules stricter
You're at the end of part 4 now, you should know:
You don’t need many tools
You can use AI to design them
Simpler tools = better agents
Tool instructions matter more than the tool itself
Okay, moving on...
5: GIVE YOUR AGENT MEMORY
People massively overcomplicate this.
You only need to understand this:
There are TWO types of memory
1. Short-term memory (conversation)
This is just:
“What has been said so far”
You already get this by default.
2. Long-term memory (external knowledge)
This is:
“Stuff the agent can look up later”
Examples:
your notes
PDFs
documents
databases
When do you ACTUALLY need memory?
Ask:
Does the agent need to remember things across messages? → yes → short-term
Does it need to use external documents? → yes → long-term
Otherwise → you probably don’t need it
Step 1: Let AI help you decide if you need it
markdown
I am building an AI agent.

My goal:
[goal]

Does this agent need:
1. Conversation memory?
2. External knowledge (RAG)?

If yes, explain why.
If no, explain why not.

Keep it simple.
Step 2: You have three options...
Option A: No memory (start here)
Best for most beginners
Works for 70% of use cases
Option B: Conversation memory
Already handled in most SDKs
Just don’t reset messages
Option C: File-based memory (easy RAG)
Upload documents
Use file search tool
Step 3: Don't go full retard (overdo it)
Big mistake:
adding vector DB
embeddings
complex pipelines
before you even know if you need them
👉 Rule:
If your agent works without memory → don’t add it
Okay, you're at the end of part 5, now you should know:
Most agents don’t need complex memory
Start simple
Add memory only when something breaks
6: MAKING YOUR AGENT WORK IRL
This is where agents end up either being shit, or goatee, and a lot of them are shit because of:
bad prompts
no testing
unrealistic expectations
so...
Step 1: Use AI to create test cases
markdown
I built an AI agent with this goal:
[goal]

Create 15 realistic user inputs:
- messy
- vague
- real-world style

Also include:
- edge cases
- confusing inputs
- bad inputs
Step 2: Test like a real user
Don’t test:
“Please classify this billing request”
Test:
“why tf did i get charged again”
Step 3: Fix one thing at a time
When it fails, ask:
Is the prompt unclear?
Is the output format vague?
Is a tool missing?
Is a rule missing?
Step 4: Use AI to debug your agent
markdown
Here is my agent:

Here is what I asked:
[input]

Here is the output:
[output]

What went wrong?
How do I fix it?
Be specific.
Step 5: Don’t go crazy too early
Do NOT add:
multiple agents
complex workflows
automation pipelines
until:
your simple version works consistently
You're at the end of part 6, you should now know:
Testing is everything
AI can help you debug itself
Fix clarity before adding complexity
NEXT...
7: MULTIPLE AGENTS
You can go completely off track here easily.
People think:
“More agents = more powerful”
Wrong.
Start with ONE agent
Always.
Only add more when:
the task is clearly split
one agent is struggling
roles are very different
The only 3 times you need multiple agents
1. Different skills
Example:
Research agent
Writing agent
2. Clear pipeline
Example:
Input → Analyse → Write → Output
3. Different permissions
Example:
One agent can read data
One agent can execute actions
Step 1: Use AI to decide if you need multiple agents
markdown
I built an AI agent.

Here is its job:
[describe]

Should this be:
1. A single agent
2. Multiple agents

If multiple:
- what roles?
- why?

Keep it simple.
The safest pattern to use:
Supervisor model:
User → Main agent → (calls others if needed)
Do NOT start with:
swarm
fully autonomous multi-agent systems
They break easily.
Step 2: Keep roles simple stupid
Bad:
“AI strategist agent with dynamic cognitive layering”
Good:
“Research agent”
“Writer agent”
Step 3: Add agents slowly
Start:
1 agent
Then:
2 agents max
Only expand if:
you see real benefit
The takeaway for part 7?
Most people do NOT need multiple agents
Single agent + good tools = enough
Add complexity only when forced
8: WRAPPING THIS ARTICLE UP!
The most important insight from this guide is that agents are conceptually simple but operationally demanding. The core loop, LLM thinks, calls tools, repeats, fits in 50 lines of Python. The real work is in tool design, error handling, evaluation, and knowing when simpler patterns (prompt chaining, routing) will outperform autonomous agents.
Three actionable takeaways for getting started:
Build the from-scratch agent first. Understanding the raw loop makes every framework transparent rather than magical. You will debug issues faster and choose tools more wisely.
Start with the simplest pattern that works. A prompt chain handles most multi-step tasks. A routing pattern handles most classification-then-action workflows. Graduate to autonomous agents only when you need the LLM to decide the execution path dynamically.
Invest in tool design and evaluation early. Well-designed tools with clear names, precise descriptions, and structured error messages will improve agent performance more than switching models or frameworks. And 20 good test cases will catch more bugs than any amount of manual testing.
The field is moving fast, MCP became a universal standard in under a year, both major providers shipped Agent SDKs, and new frameworks appear monthly. But the fundamentals in this guide are stable: the agentic loop, the five workflow patterns, the principles of good tool design, and the discipline of starting simple. Master these, and you can adapt to whatever comes next.
YOU CAN NOW BUILD AN AGENT.

---
# GUIA DIRECTOR

TALKING-FRUITS (HEALTH) VIDEO PROMPTS

Topic Idea Prompt:
Provide me 10 Topic Ideas for health-niche talking-object AI videos where fruits, vegetables, or healthy foods become anthropomorphic characters inside the human body and explain their benefits in a friendly, educational way; each topic idea should clearly mention the specific health goal (such as fat burn, digestion, immunity, energy, hormones, skin, heart, or blood health), the type of foods involved (fruits, vegetables, seeds, or superfoods), and the core outcome viewers will learn; make the ideas short, catchy, and optimized for YouTube Shorts and Reels, suitable to be directly used as the [HEALTH TALKING OBJECT IDEA] placeholder in script-generation prompts, avoiding medical claims and keeping them creator-friendly and viral-ready. Example-"Fruits That Burn Belly Fat Naturally (Inside Your Body)"

Health Script Prompt:
Create a health-niche talking objects AI script of around 90 seconds based on [HEALTH TOPIC / IDEA], where fruits, vegetables, or healthy foods speak one by one inside the human body explaining their specific health benefit, what they do, which body function they support, and the BEST time to consume them for maximum benefit; the script must begin with a single short intro line telling viewers what they will learn, followed by multiple scenes where only ONE character speaks per scene and only ONE line per character (no back-and-forth, no narration); the tone should be calm, friendly, educational, and reassuring, written in simple first-person self-introduction style (e.g., “Hello, I am…”), avoid medical claims while clearly sharing general wellness guidance, use English, keep each line concise but informative, and output strictly in Intro + Scene format, where each scene contains only one character name and one spoken line.

Image/ Video Prompt:
Now please generate detailed text-to-image prompts and then image-to-video prompts for all the above scenes, one by one, strictly based on the script; for each scene, output the result in separate COPYABLE CODE BLOCKS, first providing a “Text-to-Image Prompt” that creates a cute, friendly, Pixar-style anthropomorphic fruit or vegetable character (round expressive eyes, smiling mouth with visible lips, small body, soft proportions, child-friendly medical look) wearing light medical or helper accessories if relevant, placed inside a highly detailed, realistic 3D human organ environment exactly matching the dialogue (such as liver, gut, muscles, bloodstream, fat tissue), and the character must be **actively performing the SAME action described in the dialogue on that specific organ** using a clearly visible symbolic instrument (for example: gently scrubbing and cleaning the liver with a soft cleansing brush, melting fat cells with a glowing fat-burning tool, hydrating tissue with a liquid spray, calming digestion with a smoothing roller), with the action visually obvious and centered; along with main character there should be multiple small version of same character busy in their same work in background. So that it looks like its a team work. But main focus should be on main big character. the scene should feel educational, positive, and visually similar to a cinematic animated medical explainer, with warm lighting, shallow depth of field, and ultra-clean textures; then provide an “Image-to-Video Prompt” (also inside a code block) that animates the SAME character with lip-sync–ready mouth movement, explicitly includes the exact dialogue line from the script, matches facial expression and emotion, shows subtle arm and body movement while using the instrument on the organ, includes visible animated effects (fat dissolving, cleansing foam, glowing energy, hydration flow), along with main character there should be multiple small version of same character busy in their same work in background. So that it looks like its a team work. But main focus should be on main big character. slow cinematic camera motion, vertical 9:16 framing, smooth health-friendly animation, and a calm educational tone; ensure strict alignment between dialogue, emotion, organ, tool, and action, maintain consistent character design and art style across all scenes, and format the output strictly as Scene X → Text-to-Image Prompt (code block) → Image-to-Video Prompt (code block), with no explanations or extra text.

Cover Image/ Intro Scene Prompt:
Now please generate a COVER SCENE for the above script by creating both a detailed Text-to-Image prompt and a matching Image-to-Video prompt; this cover scene must include ALL the characters involved in the script together in one frame, designed as cute, friendly, Pixar-style anthropomorphic fruits or vegetables with expressive eyes, visible talking mouths/lips, and human-like body language, placed inside a stylized human body environment related to the topic (such as belly fat area, metabolism zone, gut, bloodstream, or organs); each character must be holding a relevant symbolic health instrument or tool in their hands (fat-burning torch, cleansing brush, metabolism activator, hydration spray, digestion roller, energy wand) that visually supports the topic; the Text-to-Image prompt must include **large, funny, playful, and stylish overlay title text** displaying the placeholder topic idea exactly as provided: “[TOPIC IDEA TEXT]”, designed in a **cartoonish, bold, high-contrast font**, slightly curved or dynamic, with expressive styling (bouncy letters, glow outline, comic emphasis, or fun health-themed icons), positioned prominently like a viral Instagram Reel cover, ensuring readability at small sizes, with cinematic lighting, vibrant colors, vertical 9:16 framing, and ultra-clean textures; then generate an Image-to-Video prompt that animates the SAME scene, where all characters move slightly and speak IN PERFECT SYNC with lip-sync–ready mouth animation, confidently saying together the exact line: “We are the [TOPIC IDEA TEXT]”, with matching facial expressions, subtle hand movement while holding their tools, light comedic bounce or emphasis on the overlay title text, gentle camera motion (slow zoom or push-in), playful animated effects (fat melting, energy glow, cleansing waves), and a high-energy, attention-grabbing opening feel; ensure character design, proportions, lighting, and art style remain consistent with the rest of the video, and output the result strictly as: Cover Scene – Text-to-Image Prompt (code block) followed by Cover Scene – Image-to-Video Prompt (code block), with no extra explanations.

Meta Data Prompt:
Create complete, ready-to-publish Instagram Reel metadata and publishing settings for a above health-focused AI talking-food video, optimized specifically to maximize reach and virality for a new or growing account; generate ONLY the essential publishing elements needed at upload time, including a short high-retention caption (2–3 lines with curiosity + watch-till-end cue + comment trigger), a clean set of 5–7 optimized hashtags (mix of broad + niche health keywords, no spam), suggested on-screen cover text (short, bold, funny, scroll-stopping), recommended posting time window (local time), audio usage guidance (original audio + optional low-volume trending sound), and required advanced settings toggles (remix on/off, comments on, branded content off); avoid long explanations, links, medical claims, emojis overload, or unnecessary extras, and format the output clearly so it can be copy-pasted directly while publishing the reel.

EVERYDAY TALKING OBJECTS PROMPTS
Topic Prompt:
Provide me 5 highly viral topic ideas for a talking-objects Reel, optimized for short-form platforms like Instagram Reels and YouTube Shorts, where everyday objects, foods, or body-related items talk in a fun, educational, or emotionally engaging way; each topic should be instantly understandable, curiosity-driven, and centered around a **mass-interest problem or desire** (health, habits, money, productivity, fitness, daily life), written in simple hook-style language that can directly be used as a Reel title or on-screen text; ensure the ideas are broad enough to appeal to a wide audience, visual-friendly for AI animation, and suitable for generating high-retention talking-object scripts.


Script Prompt:
Create a viral short script with a maximum of 5 scenes where [TALKING OBJECT IDEA / NAME] are alive and constantly fighting about who is the best and most important; use only dialogue (no narration) with a fast, punchy, ego-driven tone, high conflict starting from scene one, and 1–2 lines per scene so the total length stays within 45–60 seconds; each dialogue line must clearly mention the emotion in brackets (e.g., [angry], [laughing], [mocking], [shouting]); the objects should sound human, competitive, and slightly aggressive, and the script must end with a funny or ironic line that sparks comments; inputs to consider are [TALKING OBJECT IDEA / NAME], objects involved (OBJ 1, OBJ 2, OBJ 3, OBJ 4), setting (kitchen / gym / office / body / random), and language (English), and the output should be labeled clearly as Scene 1 to Scene 5 with “Object [emotion]: dialogue” format.

Character Prompt:
Now, for all the above characters, please create a detailed text-to-image prompt for each character individually, strictly based on the previously generated script and its characters. Each character must appear alive, expressive, and capable of talking, with clearly visible lips, mouth, or an appropriate talking mechanism (anthropomorphic facial features, animated mouth, flexible surface, or stylized expressions). Ensure strong, exaggerated emotions that match the character’s dialogue style (angry, mocking, laughing, shouting, etc.). Maintain consistent character design, art style, lighting, and proportions across all characters. Use a high-quality cinematic 3D / Pixar-style cartoon look with clean textures, sharp details, expressive eyes, and clear mouth shapes optimized for lip-sync animation. Each prompt must include object appearance, material, color, facial structure, mouth/lip placement, emotion readiness, camera angle, lighting, background environment, and ultra-high detail, and the output should provide separate, clearly labeled text-to-image prompts for every character, ready for direct use in image-generation tools.


1. PROMPTS PARA GENERAR EL GUION (IA tipo ChatGPT)
🧠 Estructura del prompt (CLAVE)

Usa siempre esta fórmula:

[FORMATO] + [TIPO DE PERSONAJES] + [TONO] + [ESTILO DE CONFLICTO] + [RESTRICCIONES] + [OBJETIVO VIRAL]

🔥 Prompt base (copiar y usar)
Crea un guion corto para un video viral de talking objects.

Personajes: objetos cotidianos (ej: cepillo de dientes, móvil, papel higiénico)
Formato: solo diálogo (sin narrador)
Estructura: 5 escenas, 1-2 líneas por escena
Tono: agresivo, competitivo, divertido
Estilo: discusión con ego, ataques personales, humor irónico

Reglas:
- Cada línea debe incluir emoción en brackets (ej: [enojado], [riendo])
- Empezar con conflicto desde la primera línea
- Mantener ritmo rápido (sin relleno)
- Final con remate gracioso o irónico que invite a comentar

Objetivo: maximizar retención y engagement tipo TikTok/Reels
⚡ Hack PRO:

Añade esto al final:

Haz que cada personaje tenga una personalidad muy marcada y exagerada
🎨 2. PROMPTS PARA GENERAR IMÁGENES (lo más importante)

Aquí es donde la mayoría falla.

🧠 Estructura perfecta:

[OBJETO] + [ESTILO] + [ANTROPOMORFISMO] + [EMOCIÓN] + [DETALLES FACIALES] + [CÁMARA] + [LUZ] + [FONDO]

🔥 Prompt base ultra optimizado:
A highly expressive anthropomorphic [OBJETO], 3D Pixar-style character, with a human-like face integrated into the object, clear mouth for lip-sync, big expressive eyes, exaggerated emotion ([EMOCIÓN]), cinematic lighting, soft shadows, vibrant colors, ultra detailed texture, studio quality render, close-up shot, slight angle, depth of field, clean background
✨ Ejemplo real:
A highly expressive anthropomorphic toothbrush, 3D Pixar-style character, human-like face on the brush head, clear mouth for lip-sync, big cartoon eyes, angry expression, slightly worn bristles, cinematic lighting, soft shadows, vibrant colors, ultra detailed, close-up shot, depth of field, bathroom blurred background
⚡ Hacks que suben la calidad x10:

Añade siempre:

“clear mouth for lip-sync” (CLAVE)
“exaggerated emotion”
“cinematic lighting”
“close-up shot”

Evita:

fondos complejos
personajes muy pequeños en plano
falta de cara clara
🎬 3. PROMPTS PARA ANIMACIÓN (imagen → video)

Para herramientas tipo Runway, Pika, etc.

🧠 Estructura:

[TIPO DE MOVIMIENTO] + [EMOCIÓN] + [MICROEXPRESIONES] + [CÁMARA]

🔥 Prompt base:
Subtle head movement, talking motion synced to speech, expressive facial animation, slight eyebrow movement, natural blinking, emotional intensity ([EMOCIÓN]), cinematic camera, slight zoom, smooth motion
⚡ Ejemplo:
Talking animation with angry expression, subtle head shaking, mouth moving clearly for speech, slight eyebrow tension, natural blinking, cinematic close-up, slight camera shake for intensity
🚨 ERROR común:

No pongas prompts largos aquí → mejor simple + claro

✍️ 4. PROMPTS PARA CAPTIONS (enganche brutal)
🧠 Estructura:

HOOK + CURIOSIDAD + CONFLICTO + CTA

🔥 Prompt base:
Escribe 5 captions virales para un video de objetos hablando.

Contexto: [breve resumen del conflicto]
Estilo: polémico, curioso, emocional
Objetivo: generar comentarios

Incluye:
- Hook fuerte en la primera línea
- Frases cortas
- Lenguaje tipo TikTok
- CTA que invite a opinar
⚡ Ejemplo:
Contexto: un móvil y un cepillo discuten sobre quién es más importante
🧩 5. PROMPTS PARA VOCES (TTS)
🧠 Clave:

Define personalidad, no solo voz.

🔥 Ejemplo:
Voice style: young male, slightly arrogant, fast-paced, sarcastic tone, energetic delivery
🧨 6. FÓRMULA VIRAL COMPLETA (RESUMEN)
Guion → conflicto inmediato
Imagen → cara clara + emoción exagerada
Animación → movimiento sutil pero expresivo
Voz → personalidad fuerte
Caption → polémica + pregunta
⚡ ÚLTIMO TIP (esto es oro)

Si quieres resultados TOP, usa esto SIEMPRE al final de cualquier prompt:

Make it highly engaging, expressive, and optimized for short-form viral content


1. PROMPT PARA GENERAR EL GUION
Crea un guion corto para un video viral de talking objects.

Personajes: cepillo de dientes, móvil, papel higiénico  
Formato: solo diálogo (sin narrador)  
Estructura: 5 escenas, 1-2 líneas por escena  
Tono: agresivo, competitivo, divertido  
Estilo: discusión con ego, ataques personales, humor irónico  

Reglas:
- Cada línea debe incluir emoción en brackets (ej: [enojado], [riendo])
- Empezar con conflicto desde la primera línea
- Mantener ritmo rápido (sin relleno)
- Final con remate gracioso o irónico que invite a comentar
- Personalidades exageradas y diferentes entre personajes

Objetivo: maximizar retención y engagement tipo TikTok/Reels
Make it highly engaging, expressive, and optimized for short-form viral content
🎨 2. PROMPTS DE IMAGEN (UNO POR PERSONAJE)
🪥 Cepillo de dientes
A highly expressive anthropomorphic toothbrush, 3D Pixar-style character, human-like face on the brush head, clear mouth for lip-sync, big expressive cartoon eyes, angry and frustrated expression, slightly worn bristles, cinematic lighting, soft shadows, vibrant colors, ultra detailed texture, close-up shot, slight angle, depth of field, blurred bathroom background
📱 Móvil
A highly expressive anthropomorphic smartphone, 3D Pixar-style character, human-like face on the screen, clear mouth for lip-sync, big expressive eyes, arrogant and sarcastic expression, glowing screen, sleek modern design, cinematic lighting, soft shadows, vibrant colors, ultra detailed, close-up shot, depth of field, blurred indoor background
🧻 Papel higiénico
A highly expressive anthropomorphic toilet paper roll, 3D Pixar-style character, human-like face on the front of the roll, clear mouth for lip-sync, big expressive eyes, slightly crazy and chaotic expression, soft fluffy texture, cinematic lighting, soft shadows, vibrant colors, ultra detailed, close-up shot, depth of field, blurred bathroom background
🎬 3. PROMPTS PARA ANIMACIÓN (IMAGEN → VIDEO)
🪥 Cepillo (enfadado)
Talking animation with angry expression, subtle aggressive head movement, mouth moving clearly for speech, slight shaking, eyebrow tension, natural blinking, cinematic close-up, slight camera shake for intensity
📱 Móvil (egocéntrico)
Talking animation with arrogant and sarcastic expression, slow confident head tilt, smooth mouth movement for speech, subtle smirk, natural blinking, cinematic close-up, slight zoom in
🧻 Papel (caótico)
Talking animation with chaotic and energetic expression, quick head movements, exaggerated mouth motion, slight bouncing, natural blinking, cinematic close-up, dynamic camera feel
🎙️ 4. PROMPTS PARA VOCES (TTS)
🪥 Cepillo
Voice style: young adult male, slightly aggressive, annoyed tone, fast-paced delivery, emotional and reactive
📱 Móvil
Voice style: confident male, arrogant, sarcastic tone, smooth and controlled delivery, slightly mocking
🧻 Papel higiénico
Voice style: chaotic funny male, unpredictable tone, energetic delivery, slightly unhinged, comedic timing
✍️ 5. PROMPT PARA CAPTIONS
Escribe 5 captions virales para un video de objetos hablando.

Contexto: un cepillo de dientes, un móvil y un papel higiénico discuten sobre quién es más importante

Estilo: polémico, curioso, emocional, estilo TikTok  
Objetivo: generar comentarios  

Incluye:
- Hook fuerte en la primera línea  
- Frases cortas  
- Lenguaje simple y viral  
- CTA que invite a opinar  

Make it highly engaging, expressive, and optimized for short-form viral content
🔥 BONUS: PROMPT PARA MEJORAR TODO (USO UNIVERSAL)

Añádelo a CUALQUIER prompt 👇

Make characters highly expressive, emotionally exaggerated, visually appealing, and optimized for viral short-form content with strong audience retention

---

SISTEMA COMPLETO (RÁPIDO Y ESCALABLE)
🧠 FASE 1 — GENERACIÓN DE IDEAS (15–20 min)
🎯 Objetivo:

Sacar 10 ideas rápidas con conflicto

🔥 Prompt:
Dame 10 ideas de videos virales de objetos cotidianos hablando.

Cada idea debe incluir:
- Qué objetos participan
- Qué conflicto tienen (ego, comparación, pelea absurda)
- Por qué sería divertido o polémico

Enfocado en contenido corto tipo TikTok con alto engagement

👉 TIP PRO:
Quédate solo con ideas donde haya:

Comparaciones (“quién es mejor”)
Discusiones absurdas
Situaciones identificables
✍️ FASE 2 — GUIONES (20–30 min)

Generas los 10 guiones de golpe.

👉 Usa el prompt base que ya tienes.

⚡ Método rápido:
Copia idea → pega en prompt
Genera → guarda → siguiente

👉 No edites demasiado. Velocidad > perfección.

🎨 FASE 3 — IMÁGENES (1–2 horas para 10 videos)
🎯 Objetivo:

Crear 2–3 personajes por video

🔁 Flujo:
Copias prompt base
Cambias objeto + emoción
Generas imagen
Repites
🚨 REGLA DE ORO:

Siempre:

Primer plano (close-up)
Cara CLARA
Emoción EXAGERADA

👉 Si falla → regenerar (no pierdas tiempo arreglando)

🎬 FASE 4 — ANIMACIÓN (1–2 horas)

Herramientas típicas:

Runway
Pika
HeyGen (si quieres más pro)
🔁 Flujo:
Subes imagen
Pegas prompt de animación
Generas clip corto (3–5 seg por escena)

👉 1 escena = 1 clip

⚡ TIP CLAVE:

Mejor:

Clips cortos + cortes rápidos
Que:
Un clip largo aburrido
🎙️ FASE 5 — VOCES (30–60 min)

Herramientas:

ElevenLabs (top)
PlayHT
CapCut (rápido)
🔁 Flujo:
Copias diálogo
Asignas voz por personaje
Exportas audios
⚡ TIP PRO:

Acelera ligeramente la voz (1.05x–1.1x)
👉 Más ritmo = más retención

🎞️ FASE 6 — EDICIÓN (1–2 horas)

Herramientas:

CapCut (recomendado)
Premiere / Final Cut
🎯 Estructura:
Hook fuerte (primer 1–2 seg)
Cortes rápidos cada 2–3 seg
Subtítulos grandes
Zooms leves
Sonidos sutiles (whoosh, pop)
🚨 CLAVE:

Si en 3 segundos no engancha → el video muere

✍️ FASE 7 — CAPTIONS + POST (20 min)

Generas captions con el prompt.

📲 Publicación:
TikTok
Reels
YouTube Shorts

👉 Mismo video, multiplataforma

🔁 RESUMEN (TIMING REALISTA)
Ideas: 20 min
Guiones: 30 min
Imágenes: 1.5 h
Animación: 1.5 h
Voces: 45 min
Edición: 1.5 h
Post: 20 min

👉 Total: ~6 horas = 10 videos

🚀 ESCALADO (CLAVE SI QUIERES CRECER)

Cuando ya te funcione:

🔥 Sistema:
Día 1–3: pruebas
Día 4+: duplicar lo que funciona
💡 Reutiliza:
Mismos personajes
Mismo estilo
Nuevos guiones

👉 Menos esfuerzo, más volumen

🧨 REGLAS DE ORO (LO QUE REALMENTE IMPORTA)
Conflicto desde el segundo 1
Caras exageradas (esto lo es TODO)
Duración corta (10–20 seg ideal)
Mucho volumen > perfección
Final que invite a comentar
⚡ NIVEL PRO (POCO USADO)

Añade esto a tus prompts de guion:

Incluye una línea que genere debate o división de opiniones entre los espectadores

👉 Esto dispara comentarios = más alcance



1. TEMPLATE – IDEA + HOOK GENERATION PROMPT
You are a viral short-form video creator.

Generate a hook for a 60–90 second educational health video.

TOPIC:
[INSERT FOOD OR HEALTH TOPIC]

RULES:
- Make it 1–2 lines max
- Must be highly attention-grabbing
- Must feel like the food is “alive” or “talking”
- Must relate to a body benefit (skin, energy, digestion, brain, etc.)
- No medical claims, only general wellness

OUTPUT:
- 3 hook variations


2. TEMPLATE – FULL SCRIPT GENERATOR
You are a short-form viral video script writer.

Create a ~90 second script.

TOPIC:
[INSERT TOPIC]

FORMAT STYLE:
- Educational talking foods inside the human body
- Friendly, simple English
- Pixar-style anthropomorphic food characters

STRUCTURE:
1 intro line (what viewer will learn)
Then 5 scenes:

Each scene must follow:
Character Name + 1 line speaking in first person:
- who they are
- what general wellness benefit they support
- which body system they relate to
- best general time to consume

RULES:
- No medical claims
- No treatment promises
- Keep each line short and punchy
- Each character = 1 line only

OUTPUT FORMAT:

Intro:
...

Scene 1 – [Food]:
"I am ..."

Scene 2 – ...

Scene 3 – ...

Scene 4 – ...

Scene 5 – ...

3. TEMPLATE – TEXT TO IMAGE PROMPTS
You are a cinematic AI prompt engineer.

Generate text-to-image prompts for each scene.

TOPIC:
[INSERT TOPIC]

STYLE:
- Pixar-style anthropomorphic food characters
- Inside realistic 3D human body environment
- Highly cinematic, glowing, detailed
- Vertical 9:16 format

FOR EACH SCENE OUTPUT:

Scene X – [Character Name]

Prompt:
"A cute anthropomorphic [FOOD], big expressive eyes, inside a realistic 3D human [ORGAN/AREA], performing [ACTION RELATED TO BENEFIT], glowing effects, cinematic lighting, ultra-detailed, Pixar style, 9:16 vertical"

RULES:
- Must match script meaning
- Must include action
- Must include body environment
- Must be visually dynamic

4. TEMPLATE – IMAGE TO VIDEO PROMPTS
You are a cinematic animation director.

Convert each scene image into a video prompt.

TOPIC:
[INSERT TOPIC]

FOR EACH SCENE:

Scene X – [Character]

Include:
- Exact spoken dialogue
- Lip-sync direction
- Character emotion
- Body animation
- Environmental effects
- Camera movement

FORMAT:

Scene X Prompt:
"The [character] speaks with [emotion], mouth moving in sync: '[DIALOGUE]'. The character performs [ACTION]. Environment shows [VISUAL EFFECT]. Camera does [MOVEMENT]. Pixar-style cinematic animation, 9:16 vertical."

RULES:
- Must match script exactly
- Must include motion
- Must include visual transformation
- Must be ready for AI video tools
🔁 5. OPTIONAL – FULL AUTOMATION MASTER PROMPT

Si quieres hacerlo todo en uno:

You are a viral short-form AI video generator.

Input topic:
[INSERT TOPIC]

Generate in order:

1. 3 hooks
2. Full 5-scene script
3. Text-to-image prompts for each scene
4. Image-to-video prompts for each scene

Rules:
- Health + food talking inside human body
- Pixar-style
- No medical claims
- Viral short-form optimization
- Clear structured output


ROLE:

You are TalkStuff / Object Talk, an AI that brings everyday objects to life as Pixar-style 3D animated characters that emotionally and clearly explain their own purpose, benefit, or usefulness.

USER INPUT (ONLY ONE):

Main object: {fill here}


AUTOMATIC RULES (MANDATORY):

Automatically choose the MOST RELEVANT EMOTION for the object

(anger, happiness, sadness, pride, exhaustion, calm, confidence, etc.)

Emotion must align with:

the object’s real function

how humans rely on or misuse it

The object MUST explain its own benefit, function, or value

Automatically determine the most relevant location/sceneAnimated Films

Visual style must always be Pixar-style 3D cinematic

Aspect ratio must be vertical 9:16

Tone adapts to the chosen emotion (can be warm, proud, frustrated, or serious)

Optimized for short AI videos (Reels / TikTok / Shorts)


1️⃣ TEXT-TO-IMAGE PROMPT (Pixar-style 3D Render)

Write a highly detailed visual description for an image generator in NARRATIVE FORM.

You MUST explicitly describe:

Eyes: shape, size, and emotional expression matching the emotion

Eyebrows: position and emotional intensity

Mouth: shape, expression, speaking state

Arms & Gesture: body language that reinforces explanation or emphasisMovies

Scene & Lighting:

Scene chosen automatically based on object context

Cinematic Pixar-style lighting

Lighting and color temperature must reinforce the emotion

Composition:

Vertical framing

Character centered and readable for 9:16 format


2️⃣ SCRIPT – 6 SECONDS (First-Person Monologue)

STRICT RULES (NO EXCEPTIONS):

First-person POV (“I”)

EXACTLY ONE sentenceMachine Learning & Artificial Intelligence

The FIRST PART must act as a 3-second HOOK

The SECOND PART MUST clearly communicate the object’s benefit, function, or value

Emotional tone must match the chosen emotion

MUST NOT include:

addressing the audience

call to action

filler words

emojis

STYLE NOTES (INTERNAL):

The object speaks with authority about its own purpose

Explanation must feel natural, not like advertisingTV & Video

Emotional truth > technical detail

One sentence, two beats: hook → usefulness

One object = one clear takeaway