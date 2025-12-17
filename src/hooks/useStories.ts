import { useState, useEffect } from 'react';
import { StoryMeta, LibraryData } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function useLibrary() {
  const [stories, setStories] = useState<StoryMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLibrary() {
      try {
        // Fetch the library index
        const libraryRes = await fetch(`${BASE_PATH}library.json`);
        if (!libraryRes.ok) throw new Error('Failed to load library');
        const libraryData: LibraryData = await libraryRes.json();

        // Fetch metadata for each story
        const storyPromises = libraryData.slugs.map(async (slug) => {
          try {
            const metaRes = await fetch(`${BASE_PATH}stories/${slug}/meta.json`);
            if (!metaRes.ok) return null;
            const meta: StoryMeta = await metaRes.json();
            return meta;
          } catch {
            console.warn(`Failed to load story: ${slug}`);
            return null;
          }
        });

        const results = await Promise.all(storyPromises);
        setStories(results.filter((s): s is StoryMeta => s !== null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLibrary();
  }, []);

  return { stories, loading, error };
}

export function useStory(slug: string) {
  const [story, setStory] = useState<StoryMeta | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStory() {
      try {
        setLoading(true);
        setError(null);

        // Fetch metadata
        const metaRes = await fetch(`${BASE_PATH}stories/${slug}/meta.json`);
        if (!metaRes.ok) throw new Error('Story not found');
        const meta: StoryMeta = await metaRes.json();
        setStory(meta);

        // Fetch story content
        const contentRes = await fetch(`${BASE_PATH}stories/${slug}/story.md`);
        if (!contentRes.ok) throw new Error('Story content not found');
        const markdown = await contentRes.text();
        setContent(markdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchStory();
    }
  }, [slug]);

  return { story, content, loading, error };
}

export function useStoryNavigation(currentSlug: string, stories: StoryMeta[]) {
  const currentIndex = stories.findIndex(s => s.slug === currentSlug);
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;
  const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;

  return { prevStory, nextStory, currentIndex };
}
