tt=open('/tmp/claude-0/-home-user-Test/a8426214-89c6-5c80-84be-08897db4607b/scratchpad/tt.txt').read().strip()
yt_desc='''A volcanic eruption around 1345 may have set off a chain that helped bring the Black Death to Europe: cold, wet summers, failed crops, grain imported from the Black Sea in 1347, and plague fleas most likely in the grain dust. Milan and Rome apparently did not need grain imports and were most probably spared.
This is a hypothesis from a 2025 study (Bauch & Büntgen, Communications Earth & Environment). Some historians are cautious.

Would you have opened the port? Tell me in the comments.

Sources:
Paper: https://doi.org/10.1038/s43247-025-02964-0
University of Cambridge: https://www.cam.ac.uk/stories/volcanoes-black-death
Live Science: https://www.livescience.com/planet-earth/volcanic-eruption-triggered-butterfly-effect-that-led-to-the-black-death-researchers-find
BBC Science Focus: https://www.sciencefocus.com/news/massive-volcanic-eruptions-black-death

Characters are cartoon illustrations. AI voiceover.
#Shorts #history #blackdeath'''
ig='''Did a volcano help bring the Black Death to Europe? 🌋
A 2025 study says it may have: an eruption around 1345, cold summers, failed crops, then grain ships from the Black Sea, with fleas most likely hiding in the grain dust.
Venice imported the grain. Milan and Rome apparently didn't need to, and were most probably spared.
It's a hypothesis, and some historians are cautious.
Your city is starving and the ships arrive. Open the port? 👇
Sources in the first comment. AI voiceover
#history #blackdeath #volcano #medievalhistory #sciencefacts'''
first='Sources: paper (Bauch & Büntgen 2025) https://doi.org/10.1038/s43247-025-02964-0 · Cambridge https://www.cam.ac.uk/stories/volcanoes-black-death · Live Science https://www.livescience.com/planet-earth/volcanic-eruption-triggered-butterfly-effect-that-led-to-the-black-death-researchers-find'
p='UPLOAD.md'; s=open(p).read()
s=s.replace('- Primary paper: https://doi.org/10.1038/s43247-025-02964-0.','- Primary paper: https://doi.org/10.1038/s43247-025-02964-0')
s=s.replace('Caption (write with /tt-caption, lint with caption.py):\n```\nTODO\n```','Caption (linted with caption.py: READY):\n```\n'+tt+'\n```\n\nFirst comment (pin it):\n```\n'+first+'\n```')
s=s.replace('Title (/yt-package, under 60 chars): TODO','Title (under 60 chars): `Did a Volcano Bring the Black Death to Europe? 🌋`')
s=s.replace('Description (/yt-seo):\n```\nTODO\n```','Description:\n```\n'+yt_desc+'\n```')
s=s.replace('Caption (/ig-caption, max 5 hashtags):\n```\nTODO\n```','Caption (5 hashtags):\n```\n'+ig+'\n```\n\nFirst comment (pin it):\n```\n'+first+'\n```')
open(p,'w').write(s)
print([l for l in s.splitlines() if 'TODO' in l])
