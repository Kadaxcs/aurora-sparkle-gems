import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazily load pages for faster first load
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Products = lazy(() => import("./pages/Products"));
const Rings = lazy(() => import("./pages/Rings"));
const Earrings = lazy(() => import("./pages/Earrings"));
const Necklaces = lazy(() => import("./pages/Necklaces"));
const Bracelets = lazy(() => import("./pages/Bracelets"));
const Sets = lazy(() => import("./pages/Sets"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Page = lazy(() => import("./pages/Page"));
const JoiasPersonalizadas = lazy(() => import("./pages/JoiasPersonalizadas"));
const CuidadosJoias = lazy(() => import("./pages/CuidadosJoias"));
const MeusPedidos = lazy(() => import("./pages/MeusPedidos"));


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen animate-pulse" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/aneis" element={<Rings />} />
            <Route path="/brincos" element={<Earrings />} />
            <Route path="/colares" element={<Necklaces />} />
            <Route path="/pulseiras" element={<Bracelets />} />
            <Route path="/conjuntos" element={<Sets />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/produto/:productId/:slug?" element={<ProductDetail />} />
            <Route path="/pedido-confirmado/:orderId" element={<OrderConfirmation />} />
            <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/joias-personalizadas" element={<JoiasPersonalizadas />} />
            <Route path="/cuidados-joias" element={<CuidadosJoias />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/page/:slug" element={<Page />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
