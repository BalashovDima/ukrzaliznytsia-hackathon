import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import IndexPage from "./pages/IndexPage";
import LogistDashboard from "./pages/LogistDashboard";
import CreateShipmentPage from "./pages/CreateShipmentPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/client/create-shipment" element={<CreateShipmentPage />} />
          <Route path="/client/shipments" element={<ShipmentsPage />} />
          <Route path="/manage/dashboard" element={<LogistDashboard />} />
          <Route path="/manage/shipments" element={<ShipmentsPage />} />
          <Route path="/manage/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
