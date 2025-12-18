Adding new stories (PagePortals)

Each story lives in its own folder under stories/ and is “registered” by adding its slug to library.json.

The app expects poster assets to be located at:
	•	stories/<slug>/<posterImage>
	•	stories/<slug>/<posterVideo> (optional)

⸻

1) Pick a slug

Use kebab-case (lowercase, hyphens only).

Examples:
	•	echoes-of-andromeda
	•	the-signal-rider

Your folder name must match the slug.

⸻

2) Create the story folder

Create:
stories/
your-new-slug/

⸻

3) Add poster assets (image + optional video)

Inside stories/your-new-slug/ add:
	•	poster.webp (or .jpg/.png)
	•	poster.mp4 (optional short loop)

Recommended:
	•	Poster image: 2:3 ratio (e.g. 1200×1800), compressed.
	•	Poster video: 3–6s, no audio, small filesize (H.264 MP4).

Tip: Keep filenames simple (poster.webp, poster.mp4) to avoid mistakes.

⸻

4) Create meta.json

In stories/your-new-slug/meta.json:

IMPORTANT: The safest way is to copy an existing story’s meta.json and edit it, keeping the same keys.

Template (adjust to match the keys used by your existing stories):

{
“slug”: “your-new-slug”,
“title”: “Your Story Title”,
“genre”: “Sci-Fi”,
“year”: 2025,
“author”: “PagePortals”,
“readingTimeMins”: 22,
“shortDescription”: “A one-liner that shows on cards and at the top of the story page.”,
“tags”: [“space”, “first contact”, “mystery”],
“posterImage”: “poster.webp”,
“posterVideo”: “poster.mp4”
}

Notes:
	•	posterVideo is optional — remove it if you don’t have one.
	•	Don’t start posterImage / posterVideo with / unless you intentionally store assets elsewhere.

⸻

5) Add the story content

Add the actual story markdown file in the same folder.

Copy the filename/structure from an existing story (this is important because the loader expects a specific name).

Common patterns (your project will use one of these):
	•	stories/<slug>/story.md
	•	stories/<slug>/index.md

Write your content in markdown. If the Story page already displays the title separately, avoid using an extra # Title at the top—follow the existing stories.

⸻

6) Register the story in library.json

Open library.json and add the slug to the slugs array:

{
“slugs”: [
“the-covenant-of-silence”,
“neon-requiem”,
“your-new-slug”
]
}

⸻

7) Verify

Checklist:
	•	Poster image shows on Home/Trending cards
	•	Clicking opens /story/your-new-slug
	•	Story content renders
	•	(Optional) poster video previews where expected

⸻

Troubleshooting

Story doesn’t appear on Home
	•	Confirm the slug is in library.json.
	•	Confirm the folder name exactly matches the slug.
	•	Confirm meta.json exists in the story folder.

Poster image/video doesn’t load
	•	Confirm filenames match posterImage / posterVideo in meta.json.
	•	Confirm files are located at stories/<slug>/...
	•	Avoid special characters/spaces in filenames.

Reading time/genre/author missing
	•	Ensure those fields exist in meta.json and match the keys used by other stories.
