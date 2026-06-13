import { Coffee } from "lucide-react";
import { useEffect, useState } from "react";

const INSPIRATIONAL_MESSAGES = [
  "One day at a time...",
  "Progress, not perfection.",
  "Easy does it.",
  "Keep coming back.",
  "First things first.",
  "Let go and let God.",
  "This too shall pass.",
  "Just for today.",
  "Keep it simple.",
  "Live and let live.",
  "Think, think, think.",
  "But for the grace of God.",
  "How important is it?",
  "Principles before personalities.",
  "Meeting makers make it.",
  "Suit up and show up.",
  "Take what you need.",
  "It works if you work it.",
  "Fake it till you make it.",
  "Bring the body, the mind will follow.",
  "We are only as sick as our secrets.",
  "Gratitude is the attitude.",
  "You are not alone.",
  "Together we can.",
];

interface LoadingScreenProps {
  progress: number;
  isVisible: boolean;
}

export const LoadingScreen = ({ progress, isVisible }: LoadingScreenProps) => {
  const [quote, setQuote] = useState(INSPIRATIONAL_MESSAGES[0]);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Rotate quotes every 2 seconds
    const interval = setInterval(() => {
      setQuote((prev) => {
        const currentIndex = INSPIRATIONAL_MESSAGES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % INSPIRATIONAL_MESSAGES.length;
        return INSPIRATIONAL_MESSAGES[nextIndex];
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsFadingOut(true);
    }
  }, [isVisible]);

  if (!isVisible && isFadingOut) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-out pointer-events-none">
        <LoadingContent quote={quote} progress={100} />
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <LoadingContent quote={quote} progress={progress} />
    </div>
  );
};

const LoadingContent = ({ quote, progress }: { quote: string; progress: number }) => (
  <div className="flex flex-col items-center justify-center gap-8 px-6 text-center">
    {/* Coffee Cup Icon */}
    <div className="relative">
      <div className="absolute inset-0 animate-ping-slow rounded-full bg-primary/20" />
      <div className="relative rounded-full bg-primary/10 p-6">
        <Coffee className="h-16 w-16 text-primary animate-bounce-gentle" />
      </div>
      {/* Steam effect */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1 h-6 bg-muted-foreground/30 rounded-full animate-steam" style={{ animationDelay: "0s" }} />
        <div className="w-1 h-8 bg-muted-foreground/20 rounded-full animate-steam" style={{ animationDelay: "0.3s" }} />
        <div className="w-1 h-5 bg-muted-foreground/30 rounded-full animate-steam" style={{ animationDelay: "0.6s" }} />
      </div>
    </div>

    {/* Quote */}
    <div className="max-w-sm">
      <p className="text-xl font-medium text-foreground animate-fade-in-quote italic">
        "{quote}"
      </p>
    </div>

    {/* Progress */}
    <div className="w-64 space-y-3">
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Loading meetings... {Math.round(progress)}%
      </p>
    </div>
  </div>
);
