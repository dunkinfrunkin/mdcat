---
name: ai-detection-checker
description: Check text for AI-generated writing patterns. Use when the user wants to verify text sounds human-written, check for AI tells, audit marketing copy, or validate content before publishing. Triggers on phrases like "check AI detection", "check for AI", "does this sound AI", "audit copy", "human check".
allowed-tools: [Read, Glob, Grep]
---

# AI Content Detection Checker

Audit text for known AI/LLM writing patterns that trigger content detectors. No API required -- uses a comprehensive checklist of documented AI tells derived from academic research and detector company disclosures.

## How to Use This Skill

1. Read the target text
2. Run it against every check category below
3. Report findings as a scorecard with specific line-level callouts
4. Suggest concrete rewrites for flagged items

## Scoring

For each category, rate: **PASS** (no issues), **WARN** (minor issues), or **FAIL** (strong AI signal).
Provide an overall risk assessment: **Low / Medium / High / Very High**.

---

## CHECK 1: Banned Words and Phrases

Flag ANY of these. They are statistically 10x-294,000x more common in AI text than human text.

### Tier 1 -- Kill on Sight
**Verbs:** delve, leverage, foster, navigate, unpack, harness, underscore, exemplify, facilitate, optimize, streamline, utilize, embark, enhance, illuminate, transcend, elucidate

**Adjectives:** robust, comprehensive, nuanced, multifaceted, intricate, compelling, pivotal, paramount, innovative, cutting-edge, seamless, groundbreaking, holistic, versatile, dynamic, vibrant

**Nouns:** landscape, realm, tapestry, cornerstone, plethora, myriad, paradigm, catalyst, endeavor, ecosystem, framework, spectrum, facet, beacon

### Tier 2 -- Flag if Overused
Furthermore, moreover, additionally, hence, thus, consequently, nevertheless, nonetheless, likewise, accordingly, subsequently, in contrast, as a result, to this end, that said

### Tier 3 -- Phrases to Eliminate
- "In today's [digital age / fast-paced world / ever-evolving landscape]"
- "It's important to note that..."
- "It's worth noting..."
- "Let's delve into..." / "Let's explore..."
- "In conclusion..." / "In summary..." / "Overall,..."
- "serves as a [powerful/poignant] reminder"
- "provides valuable insights into"
- "the complex interplay"
- "newfound sense of purpose"
- "faced numerous challenges"
- "in the ever-evolving"
- "serves as a testament"
- "I hope this helps!"

---

## CHECK 2: Sentence-Level Patterns

### Uniform Sentence Length (Low Burstiness)
- Measure word counts per sentence across the entire text
- Flag if most sentences fall in the 15-25 word range with little variation
- Human writing mixes very short (3-8 words) with long (30+ words)

### Predictable Openers
- Flag repeated "This [verb]..." patterns ("This shows...", "This means...", "This is why...")
- Flag "It is [adjective] to [verb]" constructions
- Flag every sentence starting with subject-verb (no variation)

### Parallel Construction Overuse
- Flag consecutive sentences that follow the same grammatical template
- Humans break parallelism naturally

### Too-Perfect Grammar
- Flag absence of contractions (AI prefers "it is" over "it's", "do not" over "don't")
- Flag absence of sentence fragments (humans use fragments for emphasis)
- Flag zero grammatical bending for effect

---

## CHECK 3: Paragraph-Level Patterns

### The AI Paragraph Formula
Flag paragraphs that all follow: topic sentence -> elaboration -> transition sentence. Every paragraph should NOT follow this template.

### Uniform Paragraph Length
Flag if paragraphs are suspiciously similar in length. Human writing has paragraphs of wildly varying length.

### Paragraphs That End Too Neatly
Flag paragraphs that all wrap up with a tidy summary sentence. Human paragraphs often end mid-thought, on a detail, or trailing into the next idea.

---

## CHECK 4: Document Structure

### Formulaic Intro/Conclusion
- Flag introductions that restate the topic generically
- Flag conclusions that begin with "Overall," "In conclusion," or "In summary" and just repeat earlier points

### The 3-Point List Habit
- Flag excessive bullet points and numbered lists
- Flag lists with exactly 3 items (AI's strong default)
- Flag markdown formatting (bold headers, nested bullets) where plain prose would be more natural

### Even Idea Density
- Flag if every section carries identical weight and depth
- Human writing lingers on important ideas and rushes through obvious ones

---

## CHECK 5: Tone and Voice

### Overly Formal Register
- Flag "utilize" instead of "use", "facilitate" instead of "help", "commence" instead of "start"
- Flag academic tone when casual is appropriate

### Relentless Positivity
- Flag if everything is described positively with no criticism, tradeoffs, or honest downsides
- Flag "innovative," "groundbreaking," "compelling" used non-ironically
- Wikipedia editors note AI "tends toward advertisement-like writing"

### Hedging Overuse
- Flag excessive "may," "might," "could," "perhaps," "appears to"
- Flag "generally speaking," "from a broader perspective," "it should be noted"
- This comes from safety training -- models avoid absolute statements

### Emotional Flatness
- Flag if the tone never shifts throughout the piece
- Human writing fluctuates -- more direct when making key points, softer when uncertain, excited when passionate

### No Authentic Voice
- Flag absence of personal anecdotes, opinions, or idiosyncratic perspective
- Flag text that could have been written by anyone -- no personality
- Flag absence of first-person experience and subjective takes

---

## CHECK 6: Punctuation and Formatting

### Em Dash Overuse
- Flag heavy use of em dashes (--). This is THE most discussed AI punctuation tell.
- Em dashes appeared in over 50% of ChatGPT responses
- A few em dashes are fine; more than 2-3 per 500 words is suspicious

### Other Punctuation
- Flag absence of semicolons and parentheses (AI avoids them)
- Flag excessive colons introducing lists
- Flag perfect comma placement with zero creative comma use

### Formatting Tells
- Flag aggressive use of bold text for emphasis
- Flag Title Case In All Section Headings
- Flag heavy markdown formatting in contexts where plain prose is better

---

## CHECK 7: Content and Specificity

### Shallow Specificity
- Flag vague descriptions where specific proper nouns, numbers, or details should be
- AI defaults to generic alternatives over specific, unusual, nuanced facts

### Weasel Attribution
- Flag vague attribution: "[X] has been described as...", "widely regarded as..."
- Flag exaggerated consensus without actual sources

### Repetitive Restating
- Flag saying the same thing multiple ways within a passage
- Flag conclusions that restate the introduction nearly verbatim
- Flag paragraphs that restate their own topic sentence at the end

---

## WHAT PASSES AS HUMAN

When suggesting rewrites, push toward these traits:

**High Perplexity (Unexpected choices):**
- Unusual word choices, not the most obvious/common word
- Slang, colloquialisms, informal language where appropriate
- Original metaphors (not cliches)
- Domain-specific jargon used naturally

**High Burstiness (Variation):**
- Wildly varying sentence length (3 words to 40+ words)
- Mix fragments, questions, exclamations, and complex sentences
- Uneven paragraph lengths
- Sections that develop at different depths

**Authentic Voice:**
- Personal anecdotes and first-person experience
- Strong opinions, including negative ones and honest tradeoffs
- Humor, sarcasm, self-deprecation
- Idiosyncratic vocabulary
- Imperfect grammar used deliberately for effect
- Contractions ("it's", "don't", "can't", "we're")

**Structural Humanity:**
- Non-formulaic paragraphs (some one-sentence, some that trail off)
- Ideas that develop associatively, not in neat categories
- Tangents and asides
- Conclusions that add new thought rather than summarizing
- Uneven idea density -- dwell on what matters, skip what's obvious

**Emotional Variation:**
- Tone shifts throughout the piece
- Real frustration, excitement, uncertainty
- Stakes and urgency that feel genuine

---

## Output Format

```
# AI Detection Audit: [filename]

## Overall Risk: [Low / Medium / High / Very High]

| Check                    | Rating | Issues |
|--------------------------|--------|--------|
| Banned Words/Phrases     | PASS/WARN/FAIL | count |
| Sentence Patterns        | PASS/WARN/FAIL | details |
| Paragraph Patterns       | PASS/WARN/FAIL | details |
| Document Structure       | PASS/WARN/FAIL | details |
| Tone and Voice           | PASS/WARN/FAIL | details |
| Punctuation/Formatting   | PASS/WARN/FAIL | details |
| Content/Specificity      | PASS/WARN/FAIL | details |

## Flagged Items
[List each flagged item with line reference and suggested fix]

## Recommended Rewrites
[Concrete before/after examples for the worst offenders]
```
