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

  // The host page's `#camf` element may be a flex/grid item, so it inherits
  // layout and typography styling from the surrounding page. Render the widget
  // into a dedicated wrapper one level deeper: `#camf` absorbs the host's
  // flex/grid item styling, while `.camf-app` hard-resets (see index.css) so
  // inner elements get our own styles applied predictably. Portals (popovers,
  // toasts, tooltips) mount into the wrapper too so they share the reset.
  const root = document.createElement('div');
  root.className = 'camf-app';
  el.appendChild(root);

  createRoot(root).render(
    <PortalContainerContext.Provider value={root}>
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
