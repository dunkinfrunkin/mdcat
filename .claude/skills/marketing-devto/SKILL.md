---
name: marketing-devto
description: Write and optimize dev.to articles for developer tool launches. Use when the user wants to write a dev.to post, optimize an article for dev.to, or cross-post content. Triggers on phrases like "devto", "dev.to", "write a post for dev.to", "dev.to article".
allowed-tools: [Read, Glob, Grep]
---

# Marketing: Dev.to Article Writing

Learnings from researching top-performing dev.to posts and launching developer tools on the platform.

## What Gets Engagement on Dev.to

### Title Formats That Work (with real engagement numbers)
- "I built [thing] because [relatable frustration]" (37+ reactions)
- "I built [thing] that [bold claim]" (34+ reactions)
- "[Number] [things] that [saved/changed] [outcome]" (132+ reactions)
- "How I [vulnerable admission]" (110+ reactions)

### Title Formats That Flop
- Generic announcements: "X is Now Available"
- Pure technical: "I Built a CLI Tool to Do X" with no personal angle
- No frustration hook: "Getting Started with X"

## Post Structure (proven format)

1. **Hook** (1-2 paragraphs): Relatable frustration. Do NOT mention the tool name yet. Open with the feeling of the problem, not "Hi, I'm X and I built Y."
2. **Failed alternatives** (1 paragraph): What you tried, why it didn't work. Spend MORE time on the problem than the solution.
3. **"So I built..."** transition (1 sentence): Brief intro
4. **What it does** (bullets or short sections): Features, not implementation details
5. **How it works** (moderate detail): Enough to be credible, not a tutorial
6. **What went wrong** (personal reflection): This is where authenticity lives. Share failures, debugging stories, embarrassing mistakes. Rename "What I Learned" to "What Went Wrong" for better engagement.
7. **CTA + follow links** (closing): Try it, star it, links to site/repo/socials. End with a question that invites readers to share their own experience.

### Ratio
- 40% problem/frustration
- 30% solution/features
- 20% what went wrong
- 10% CTA and follow links

## Tone Rules

### Do
- First person, casual ("honestly?", "turns out...", "felt dumb")
- Self-deprecating honesty about mistakes
- Specific details (exact error messages, line counts, time wasted)
- Contractions ("it's", "don't", "can't")
- Sentence fragments for emphasis
- ALL CAPS sparingly for genuine emotion
- Questions to the reader
- Pop culture references if they fit naturally

### Don't
- Em dashes (biggest AI tell, use periods/commas/colons/parentheses instead)
- Words from the AI kill list (see ai-detection-checker skill)
- Academic tone, hedging language ("it's worth noting", "generally speaking")
- Uniform sentence length (mix short punchy with longer ones)
- Every paragraph ending neatly with a summary sentence
- Relentless positivity with no honest downsides
- Starting with "In today's..." or "Let's explore..."

## Tags Strategy

- Dev.to allows exactly 4 tags
- Lead with high-traffic tags: `opensource`, `productivity`, `webdev`, `javascript`
- Niche tags like `cli` or `terminal` get less competition for staff featuring
- Check for active dev.to writing campaigns and use their designated tags

## Posting Strategy

### Timing
- Monday-Wednesday, 10:00-14:00 UTC (catches EU afternoon + US morning)
- Weekends are dead

### Cross-posting
- Publish on your own blog/site FIRST with canonical URL for SEO ownership
- Cross-post to dev.to with `canonical_url` pointing back to your site
- Also cross-post to Hashnode (supports `canonical_url`) and Medium (use "Import a story" which auto-sets canonical)
- Publish BEFORE Hacker News. HN commenters Google the tool and a dev.to article adds credibility

### Immediate Post-publish
- Heart, unicorn, and bookmark your own post
- Leave a comment on your own post
- This is standard practice on dev.to and seeds early engagement
- Share to social channels within minutes

## What Drives Comments (not just reactions)

Posts with the best comment-to-reaction ratios all share one trait: they invite people to share their own experiences.

- End with a genuine question about the reader's workflow
- "What's your terminal workflow look like these days?"
- "What tools have you been reaching for?"
- "Anyone else dealt with this?"

Debugging war stories and workflow frustration posts generate the most discussion.

## Closing Format

```markdown
## Try it

[install command]

Site: [url]
GitHub: [url]

[1-2 sentences about personal use, ties back to the story]

[Question to drive comments]

---

If you want to follow along with what I'm building:
[GitHub](url) | [X](url) | [LinkedIn](url)
```

## Checklist Before Publishing

- [ ] Title has a personal angle and frustration hook
- [ ] Opening 2 paragraphs don't mention the tool name
- [ ] At least one "what went wrong" story with specific details
- [ ] No em dashes anywhere in the post
- [ ] Run through ai-detection-checker skill
- [ ] 4 tags selected, high-traffic tags first
- [ ] Canonical URL set if cross-posting
- [ ] Ends with a question to drive comments
- [ ] Follow links at the bottom
- [ ] Site and repo links in the CTA section
