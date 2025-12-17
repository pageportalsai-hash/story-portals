export interface StoryMeta {
  slug: string;
  title: string;
  year?: number;
  genre: string;
  tags: string[];
  synopsis: string;
  author?: string;
  readingTimeMins?: number;
  posterImage: string;
  posterVideo?: string;
}

export interface Story extends StoryMeta {
  content: string;
}

export interface LibraryData {
  slugs: string[];
}
