youtube video transcript

So, I'm going to fire off a prompt to my Open Claw agent. Hey, create an animated video about foods that secretly expire way faster than you think. >> Hey, so that expiration date on my carton, yeah, that is basically made up. I actually go bad 3 to 5 weeks after you buy me. >> I'm going to fire that off and my Open Claw agent is going to get to work and it's going to create this video, this animated AI video from scratch. It's going to generate the script, all of the scenes, all of the images. It's going to animate all of the images with audio and then splice it all together in one shot. So, you can see it's generated the scenes here in the different AI animation characters. So, it's going to do eggs, hummus, cooked rice, and deli meat. And it's going to say, "Let me start generating the images and animations now." All right. So, you can see I'm checking in with my bot Claude. And it's saying, "Hey, let me send you the final video and the individual scene images so you can see how they came out." And there we have a 27 second video. Let me open this up and actually play it. All right, so here it is pulled up. I have not watched it yet. Let's hit play. >> Hey, so that expiration date on my carton. Yeah, that is basically made up. I actually go bad 3 to 5 weeks after you buy me. Most people keep People think I last I last for weeks after opening. Nope. 4 to 7 days. That is a l i. >> All right. Pretty good for a oneshot video with zero edits and just completely oneshot it out of open claw. So in this video I'm going to show you how I created this skill for open claw. So open claw is able to generate these videos for me from scratch in a single prompt. Not only that, I'm going to show you how OpenClaw then spun this up into a web app that I have hosted on Replet. So, I can come in here and actually use a user interface and generate these videos as well. And by the way, if you want access to this open claw skill completely for free along with a step-bystep setup guide, then I'll leave a link to this optin below the video. All right, so if you haven't seen on Twitter or YouTube or Tik Tok, these 3D animation videos are going super viral right now. Here's one example of a Tik Tok page with only a handful of videos, but you can see some of them already have several hundred,000 views. And you can see there's real demand from brand owners and business owners for these videos. So here is Alex from Honest Brands screenshotting one of these videos and say, "Hey, I'm hiring video editors. If you can make these types of animated videos, drop me a DM." So there's real demand for talent out there that can create these types of videos. And so that's where the idea came from. I've been playing with OpenClaw for several weeks. This is my first video on it because honestly I wanted to put it to the test and give it some real use cases. Everything I've seen on YouTube about OpenClaw has been mostly noise, mostly low value workflows, checking email, checking calendar, sending you a daily update, all basic stuff with no business value. But I wanted to see if OpenClaw was up for the test and see if it could oneshot these videos. All right, so here's the prompt that I started with with my Open Claw. And this was earlier today. you can see. And I said, "Hey, you are a video reverse engineering agent. Your job is to analyze AI generated animated short form videos and produce exact recreation blueprints." So my idea to begin was, hey, I wanted to feed it examples of these Tik Tok videos, these YouTube shorts, and see if it could try to reconstruct it. And I said, you're going to download the video, you're going to extract the frames, analyze it with vision, and output a recreation blueprint. So, my agent does have access to Gemini Vision. It built a script that allows it to download Tik Tok and YouTube videos, feed that to Gemini, and it can analyze every scene. So, here you can see I fed it some reference accounts, a couple of YouTube channels, a couple of Instagram accounts, and it came back with the initial analysis here with two different templates identified, and then I said, actually, let me give you some specific YouTube URLs instead of just the channel. Let me give you the exact videos. Here's an example from a channel that's really killing it with with these video types in the non-English market. If we go to his popular videos, look at the views he's pulling in on these multiple million views doing these exact type of videos. Again, this is in a non-English niche. So, I started feeding my open claw specific YouTube video links. Here's another one. And then I started sending it links from that Tik Tok channel. And that's when I came up with the idea when we were chatting on how to reverse engineer these with a simple kind of verselbased web app. So that's where the web app idea came from in our chat. And you can see at times it does struggle fetching the URLs. Let's be honest, there's a lot of back and forth that you have to do with OpenClaw at this point. But then it came back with the architecture for the app. So initially it was the user would provide a link to the short form video and the app generates kind of a blueprint to recreate it. And then I said, actually, let's just have this hosted in Replet. And I said, forget about reverse engineering. Let's have the user be able to generate these videos from scratch. So I said, let's think of a simple form they might be able to use to send a new job. What would the user have to submit on the form on the front end? Maybe it's a character, it could be a fruit. And then I said, with those inputs, the system then generates a script. It generates all of the scenes. And then with Nano Banana, it generates images of those scenes with the character. And then I say it then passes those images off to an AI model like Google V3. Animate and narrate those scenes. I'm just thinking at high level, what do you think? So this is where the idea for the app really got fleshed out. And then you can see I went back and forth with my Clawbot a little bit and that's when I handed over the reins to codeex. So I do have my Clawbot running on a Mac Mini and on this Mac Mini over here we have Codeex downloaded. It's hooked up to my GitHub. So my Cloudbot can literally spin up a Codeex project and start coding it from scratch. So here is the GitHub repository that it created entirely on its own. I have no idea how to code. You can see the last commit was an hour ago. Created this readme file here. Encoded the entire thing from scratch with codecs on my Mac Mini as I was literally chatting with it via Telegram when I was out for a walk earlier today. All right. So, you can see I went back and forth with my agent. It said it tested and it confirmed it working. It showed me the repo on GitHub and then it came back with its first generation. So, here's the very first version it created. Let's take a look. >> Oop, are you making this chilling mistake? The cold robs me of my delicious natural flavor. All right. So, not good quality there, but for a first pass, I knew we were on the right track. And with a little prompting back and forth, I thought we could improve it. And you can see I'm chatting with my agent. I said, "Hey, it's not bad for version one. Did you actually watch and analyze the video?" So, one of the best things you can do with your open claw, especially if you're working with video content like I am, is enable it to download videos, watch videos, analyze videos, and give you an assessment of the actual work that it's creating. And you can see it gave me a very nice analysis here where Google VI was hallucinating the captions and the text, the pacing was very slow, there weren't enough cuts, and that we had an issue with the character consistency. So you can see Open Claw is auditing its own work product. And then I think where we really had a breakthrough here is when I reminded it, hey, I already gave you a link to a Tik Tok video that was a very good example. I want you to watch that video again. Analyze every single cut, every single scene, right? Almost second by second to see how they're doing it. How long are their cuts? How long are their clips? I say download it locally and then do a scene by scene analysis because their scenes are probably one to two seconds. And by the way, I was doing this with voice to text on my iPhone as I was out for a walk. So, there's definitely some typos in here. And then my open claw came back and said, "Hey, the actual structure per food item is and it came back with a full breakdown of that specific Tik Tok video." It said what our V1 got wrong and hey, here's how we're going to fix it with V2. And then it gave me V2. All right, let's just take a look at the second version of our flow here. All right, so I thought the quality of the images were good. The video quality was pretty solid. Obviously, we were missing audio. It's good we did not have any captions, but it was still very slow. Then again, I went back. I said, "Hey, watch the video, analyze the video, critique the video, right, to make it self-improving." Nine minutes later, it came back with V3. And let me play that one for you. So, this is V3, but as you can see, there's no audio. There's no story. We actually regressed quite a bit. And then finally for V4, when I said, "Hey, we need a narrative and a story. That's the whole point." And this is really when we hit our breakthrough. So, let me play V4 for you as well. >> Ginger, please stop leaving me in the fridge. The cold and moisture make mold grow all over me. >> I'm Garlic. The fridge turns me toxic. I start sprouting and release harmful substances that attack your liver. >> All right, so you can see how it was significantly better. There was actually emotion and kind of tension in the video. There was audio. The audio sounded good. The video looks great. The images look great. So that was kind of our breakthrough. And now once we had our workflow finally in place and working well, that's when I prompted my openclaw to create a specific skill for this workflow. And again, by the way, if you want access to this skill completely for free, I'll leave a link below this video. All right, so you can see here it created the skill for me and then I said, "Hey, can you also generate a guide so my students are able to install and get this skill up and running?" And so this is the guide that it generated on how to actually install this skill inside your open claw. And by the way, just as an aside, if you're a brand owner, an agency owner, a performance marketer, you want to learn these skills, how to create these tools and apps on your own so you can install them inside of your business, be sure to check out Scale AI. It's an AI and automation community for folks running their own brands and agencies. We have tons of trainings, custom workflows, and custom tools exactly like this that you can implement in your business right away. All right. So, now that we had the skill created, I wanted to go on to step two, which was actually turning this into a web app. And so, the idea here is OpenClaw, let's be honest, is it's brand new. A lot of people aren't comfortable with it, especially folks in my community. Not a lot of people are running OpenClaw quite yet. And so, in order to actually give value to them, what I usually do is turn my tools into custom web apps that they can then install inside of their replet. And so, that's exactly what I asked my OpenClaw to do right here. I said, "Hey, I want to set this up as a replet web app so my students can have a UI to enter their info and get back a finished video." And you can see my clawbot again using codeex on the Mac Mini went up and spun it up on GitHub. There was quite a bit of back and forth, you can see between me and my bot and it finished coding it on the Mac Mini and then I have Tail Scale connected on both the MacBook and the Mac Mini. So, it was able to just shoot me the zip file so I could upload it directly into Replet. And then here is the web app that it oneshotted for me. Right? So I can say foods you should never leave in the fridge. So I'm going to click on generate script. And what's going to do is generate the complete script for all four scenes. And I'm going to be able to come in here and edit this if I want. All right. So you can see that script quickly come in. Fridge fails. The great food betrayal. And so what it's doing is it's generating four food characters. We've got the tomato, the avocado, the potato, and the onion. Then we've got an image prompt for each one, a motion only prompt, and then we've got the dialogue. Now, all of these fields, if you want, are editable, right? You can come in here and change these around. What I'm going to do is just click on start generation. And what that's going to do next is first it's going to run nano banana to generate an image of each one of these characters. And then once that's done, it's going to create the video based off that image on the same screen here. All right, so you can see the tomato came in, the avocado came in, the onion came in, and we're just waiting on the potato. All right, so the potato looks a little dark and sad. That's okay. But we can see the videos now, and these purple tags are running as well. All right, so we can see those videos are starting to come in. Here is the 8-second avocado video. Here is the 8-second tomato video. Now, once it's finishing, it's actually gonna splice these videos together into one shot. So, there's the onion coming in. Hopefully, we got the potato. And then you can see now that we have the potato. It's going to assemble the final video automatically. All right, you can see our video is ready. All right, so here's that final video. I did speed it up a little bit inside of Cat Cut. I used to be so firm, so plump, a perfect sphere of sunshine. Now, >> oh, the humanity. I'm losing my layers, my dignity, and this smell. It's me. I'm becoming a weeping SL. What I is this? Something growing. I'm supposed to be dormant, a sturdy spud. Not >> all right. So, pretty good there. Not definitely not perfect, but but for a proof of concept, I think it's pretty good. So, look, is the hype on Open Claw real? I I think that's still an open question. A lot of the stuff you see on YouTube around OpenClaw is pure hype and zero value. What I'm going to try to do on this channel is find actual business use cases that can help us spin up workflows and automations that actually get things done. So again, if you want this open claw skill as well as the setup guide, I'll leave a link below to that. If you want access to the complete web app along with a bunch of other custom tools and AI automations, be sure to check out Scale AI.

--- 

open claw animated videos skill

---
name: ai-brand-video-creator
description: Create AI-animated direct response video ads with consistent brand characters. Multi-brand support, saved characters (upload or AI-generate), DR copywriting (hook → agitate → solution → CTA). For e-commerce brands and agencies running Facebook/TikTok ads. Requires FAL_KEY + GEMINI_API_KEY.
---

# AI Brand Video Creator

Generate 32-second direct response video ads with AI-animated brand mascot characters.

## What It Does

Takes a brand profile + character + concept → outputs a 4-scene animated video ad with direct response copywriting.

- **Scene 1 (Hook):** Call out the audience, name the problem
- **Scene 2 (Agitate):** Stack pain points, twist the knife
- **Scene 3 (Solution):** Product intro with specific proof points
- **Scene 4 (CTA):** Social proof + offer + clear instruction

## Required API Keys

These must be set as environment variables on the machine running OpenClaw:
- `GEMINI_API_KEY` — Google Gemini API key ([get one free](https://aistudio.google.com/apikey))
- `FAL_KEY` — fal.ai API key ([sign up](https://fal.ai), pay-as-you-go)

## Installation

See `INSTALL.md` in this skill directory for step-by-step setup.

## Cost Per Video

~$5.20 total:
- Script gen (Gemini 2.5 Flash): ~$0.01
- 4 scene images (Nano Banana Pro /edit): ~$0.40
- 4 scene animations × 8s (Veo 3.1 Fast): ~$4.80

## How to Use

Once installed, tell your OpenClaw agent:

> "Start the brand video creator app"

The agent will start the Flask server and give you the URL. Then in the web UI:

1. **Brands** → Add your brand (name + paste all brand context into one text box)
2. **Characters** → Upload a character image or generate one with AI
3. **Create** → Select brand, select character, type a concept, hit Generate
4. Wait ~10 minutes → download your video

### Brand Context Tips

Paste everything the AI needs into one text box:
- Product details (name, price, ingredients, features, USP)
- Target audience (demographics, psychographics)
- Pain points the product solves
- Reviews/social proof (star rating, review count)
- Brand voice/tone
- **Pro tip:** Run a deep research report on your brand with Gemini or Perplexity and paste the whole output

### Character Tips

- Simple, clean designs with clear faces work best
- Upload your existing mascot, or describe one and let AI generate it
- Characters are saved and reused — set it up once

## Pipeline

```
Brand + Character + Concept
        ↓
   Gemini Script (DR copywriting)
        ↓
   Nano Banana Pro /edit (4 scene images, character-locked)
        ↓
   Veo 3.1 Fast i2v (4 animated clips, character speaks)
        ↓
   ffmpeg assembly → final.mp4 (32s)
```

## Technical Notes

- **Veo duration:** Only accepts 4s, 6s, or 8s — all scenes forced to 8s
- **Animation prompts:** Must describe the character speaking, not just dialogue — otherwise Veo generates humans talking instead
- **Character consistency:** All scenes use `fal-ai/nano-banana-pro/edit` with character reference as `image_urls[0]`
- **Content filter:** Veo occasionally flags aggressive CTA language — system handles this automatically
- **Post-production:** Add captions/subtitles and music in CapCut (not baked into the video)

## File Structure

```
ai-brand-video-creator/
├── app.py              # Flask app — routes + pipeline
├── database.py         # SQLite schema + helpers
├── requirements.txt    # flask, google-genai, fal-client, requests
├── templates/
│   ├── base.html       # Shared layout + nav
│   ├── index.html      # Create page + history
│   ├── brands.html     # Brand CRUD
│   └── characters.html # Character CRUD
└── data/               # Runtime (auto-created)
    ├── app.db          # SQLite database
    ├── uploads/        # Character + product images
    └── jobs/           # Generated videos + assets
```

---

ai brand video creator installation guide 

AI Brand Video Creator — OpenClaw Skill
What This Does
This OpenClaw skill lets your AI agent create direct response video ads with consistent AI-animated brand characters. You set up a brand profile once, choose or create a mascot character, and then generate unlimited video ads just by typing a concept.
The AI writes punchy direct response copy (hook → agitate → solution → CTA), generates scene images with your character locked in, animates them with spoken dialogue, and assembles a final video.
Example prompt:
"Generate a video ad for GlowVita about why morning coffee is sabotaging your energy. Use the bear bottle character."
What you get back: A ready-to-post 9:16 vertical video (~32 seconds) with your brand's animated mascot delivering a direct response script.

What You Need
OpenClaw installed and running (docs.openclaw.ai)
FAL API key — sign up at fal.ai/dashboard/keys (powers image generation + video animation)
Google Gemini API key — get one free at aistudio.google.com/apikey (powers script writing)
ffmpeg installed on your machine (brew install ffmpeg on Mac, or apt install ffmpeg on Linux)

Installation (2 minutes)
Step 1: Download the skill
Download the skill here
Step 2: Install Python dependencies
pip install flask google-genai fal-client requests
Step 3: Set your API keys
Add both keys to your shell profile:
# Add to ~/.zshrc (Mac) or ~/.bashrc (Linux)
export FAL_KEY="your-fal-api-key-here"
export GEMINI_API_KEY="your-gemini-api-key-here"
Then restart your terminal or run source ~/.zshrc.
That's it. The skill is ready to use.

How to Use It
Tell your OpenClaw agent to start the app:
"Start the brand video creator"
The agent runs the Flask server and gives you a URL (usually http://localhost:5000). Open it in your browser.
First time setup (one-time):
Add a brand — Click Brands, enter a name, and paste all your brand context into one text box (product details, audience, pain points, reviews, voice — everything). Optionally upload a product image.
Add a character — Click Characters, either upload your own mascot image or describe one and let AI generate it.
Generate videos:
Once your brand and character are saved, just go to Create, pick them from the dropdowns, type a concept, and hit Generate. That's it — the agent handles the rest.
You can also skip the web UI entirely and just tell your agent:
"Generate a brand video for [brand name] with the [character name] character. Concept: [your idea]"
The whole process takes about 10 minutes per video.

Tips for Best Results
Brand context is everything. The more detail you paste, the better the scripts. Run a deep research report on your brand with Gemini or Perplexity and dump the whole thing in.
Simple character designs work best. Clean lines, clear face, solid colors. Complex characters drift across scenes.
Upload your actual mascot if you have one. The AI keeps it consistent across all 4 scenes.
Good concepts follow a pattern: "Why [common thing] is actually [surprising take]" or "Nobody talks about [hidden problem] with [popular product]"
Add captions in CapCut after — don't try to bake subtitles into the AI generation.
One brand setup = unlimited videos. Once your brand and character are saved, you just change the concept each time.

Troubleshooting
"FAL_KEY not set" — Make sure you exported your FAL key and restarted your terminal.
"GEMINI_API_KEY not set" — Same thing — export it and restart your terminal.
"Port 5000 in use" — macOS AirPlay Receiver uses port 5000. Disable it in System Settings → General → AirDrop & Handoff, or tell your agent to use a different port.
ffmpeg errors — Make sure ffmpeg is installed: ffmpeg -version
Slow generation — Each animation clip takes 1-3 minutes. 4 scenes = ~10 minutes total. This is normal.
Humans appearing instead of the character — This was a known Veo issue, now fixed in the prompts. If it happens, regenerate.
Character inconsistency — Use a clean, well-lit, centered character image. Simple designs reproduce more reliably.
Veo content filter errors — If a scene fails with a content policy violation, the CTA copy was too aggressive. Re-run with a softer concept.
