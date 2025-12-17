import { Link } from 'react-router-dom';
import { ArrowLeft, FileJson, FileText, Image, Film, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AddStory() {
  return (
    <div className="min-h-screen bg-background">
      <Header stories={[]} showSearch={false} />

      <main className="pt-24 pb-16 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Library
          </Link>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Add a New Story
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            A 2-minute guide to adding your story to PagePortals. No coding required!
          </p>

          {/* Steps */}
          <div className="space-y-8">
            {/* Step 1 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    Create your story folder
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Inside the <code className="bg-muted px-2 py-1 rounded text-sm">/public/stories/</code> directory, 
                    create a new folder with your story's slug (URL-friendly name).
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    <span className="text-muted-foreground">/public/stories/</span>
                    <span className="text-primary">your-story-slug</span>/
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: <code className="bg-muted px-1 rounded">midnight-express</code>, <code className="bg-muted px-1 rounded">the-last-frontier</code>
                  </p>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    Add your files
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Add the following files to your story folder:
                  </p>

                  <div className="space-y-3">
                    {/* meta.json */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <FileJson className="text-primary shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-foreground">meta.json</p>
                        <p className="text-sm text-muted-foreground">Story metadata (required)</p>
                      </div>
                    </div>

                    {/* story.md */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <FileText className="text-primary shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-foreground">story.md</p>
                        <p className="text-sm text-muted-foreground">Your story in Markdown format (required)</p>
                      </div>
                    </div>

                    {/* poster.jpg */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Image className="text-primary shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-foreground">poster.jpg</p>
                        <p className="text-sm text-muted-foreground">Cover image, 2:3 ratio recommended (required)</p>
                      </div>
                    </div>

                    {/* poster.webm */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                      <Film className="text-muted-foreground shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-foreground">poster.webm / poster.mp4</p>
                        <p className="text-sm text-muted-foreground">~12 second preview video, loops on hover (optional)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3 - meta.json template */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    Fill in meta.json
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Copy this template and fill in your story details:
                  </p>
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "slug": "your-story-slug",
  "title": "Your Story Title",
  "year": 2024,
  "genre": "Sci-Fi",
  "tags": ["space", "adventure", "ai"],
  "synopsis": "A brief description of your story...",
  "author": "Your Name",
  "readingTimeMins": 15,
  "posterImage": "poster.jpg",
  "posterVideo": "poster.webm"
}`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Note:</strong> <code>posterVideo</code>, <code>year</code>, <code>author</code>, and <code>readingTimeMins</code> are optional.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 4 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    Add to library.json
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Open <code className="bg-muted px-2 py-1 rounded text-sm">/public/library.json</code> and add your story slug to the list:
                  </p>
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "slugs": [
    "existing-story",
    "another-story",
    "your-story-slug"  // ← Add your slug here
  ]
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Done! */}
            <section className="bg-primary/10 border border-primary/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-primary shrink-0" size={28} />
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    That's it!
                  </h2>
                  <p className="text-muted-foreground">
                    Your story will now appear in the library. Push your changes to GitHub and they'll be live on your site.
                  </p>
                </div>
              </div>
            </section>

            {/* Video Tips */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                📹 Video Preview Tips
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Keep videos around 10-15 seconds, they loop automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use <strong>WebM</strong> format (VP9 codec) for best compression
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Add MP4 as fallback for Safari: name it <code className="bg-muted px-1 rounded">poster.mp4</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Target resolution: 400x600px, under 2MB
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <strong>FFmpeg command:</strong>
                </li>
              </ul>
              <pre className="bg-muted/50 rounded-lg p-3 mt-3 overflow-x-auto text-sm">
{`ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 500k -vf scale=400:600 -an -t 12 poster.webm`}
              </pre>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
