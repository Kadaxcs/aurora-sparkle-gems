import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Products from "./pages/Products";
import Rings from "./pages/Rings";
import Earrings from "./pages/Earrings";
import Necklaces from "./pages/Necklaces";
import Bracelets from "./pages/Bracelets";
import Sets from "./pages/Sets";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProductDetail from "./pages/ProductDetail";
import Page from "./pages/Page";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/aneis" element={<Rings />} />
          <Route path="/brincos" element={<Earrings />} />
          <Route path="/colares" element={<Necklaces />} />
          <Route path="/pulseiras" element={<Bracelets />} />
          <Route path="/conjuntos" element={<Sets />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/produto/:productId" element={<ProductDetail />} />
          <Route path="/pedido-confirmado/:orderId" element={<OrderConfirmation />} />
          <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/page/:slug" element={<Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
