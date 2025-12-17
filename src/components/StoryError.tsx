import { Link } from 'react-router-dom';
import { ArrowLeft, FileX, RefreshCw } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { StoryMeta } from '@/types/story';

interface StoryErrorProps {
  stories: StoryMeta[];
  type?: 'not-found' | 'load-error';
}

export function StoryError({ stories, type = 'not-found' }: StoryErrorProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header stories={stories} showSearch={false} />
      
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <FileX size={40} className="text-muted-foreground" />
        </div>
        
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
          {type === 'not-found' ? 'Story Not Found' : 'Unable to Load Story'}
        </h1>
        
        <p className="text-muted-foreground mb-8 max-w-md">
          {type === 'not-found'
            ? "The story you're looking for doesn't exist or has been moved."
            : 'There was a problem loading the story. Please check your connection and try again.'}
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Library
          </Link>
          
          {type === 'load-error' && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
