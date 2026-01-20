import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import StoryPage from "./pages/StoryPage";
import AddStory from "./pages/AddStory";
import NotFound from "./pages/NotFound";
import { AdSlot } from "./components/AdSlot";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  // StoryPage manages its own padding; other pages use footer padding
  const isStoryPage = location.pathname.startsWith('/story/');

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/story/:slug" element={<StoryPage />} />
        <Route path="/add" element={<AddStory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AdSlot />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
