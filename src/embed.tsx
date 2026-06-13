import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { initConfig } from './config';
import { PortalContainerContext } from './lib/portal-container';
import Index from './pages/Index';
import './index.css';

const queryClient = new QueryClient();

const el = document.getElementById('camf');
if (el) {
  initConfig(el.dataset);
  createRoot(el).render(
    <PortalContainerContext.Provider value={el}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Index />
        </TooltipProvider>
      </QueryClientProvider>
    </PortalContainerContext.Provider>
  );
}
