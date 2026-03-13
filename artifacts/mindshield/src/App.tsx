import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Page Imports
import { Home } from "@/pages/Home";
import { Chat } from "@/pages/Chat";
import { Dashboard } from "@/pages/Dashboard";
import { Camera } from "@/pages/Camera";
import { Voice } from "@/pages/Voice";
import { StressRelief } from "@/pages/StressRelief";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/camera" component={Camera} />
      <Route path="/voice" component={Voice} />
      <Route path="/stress-relief" component={StressRelief} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
