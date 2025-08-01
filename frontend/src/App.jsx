import { Route, Routes } from "react-router-dom";
import AuthLayout from "./components/auth/layout";
import AuthLogin from "./pages/auth/login";
import AuthRegister from "./pages/auth/register";
import AdminLayout from "./components/admin-view/layout";
import AdminOrders from "./pages/admin-view/orders";
import AdminUser from "./pages/admin-view/user";
import AdminProducts from "./pages/admin-view/products";
import NotFound from "./pages/not-found";
import ShoppingLayout from "./pages/shopping-view/layout";
import ShoppingHome from "./pages/shopping-view/home";
import ShoppingAccount from "./pages/shopping-view/account";
import ShoppingUploads from "./pages/shopping-view/uploads";
import ShoppingCheckout from "./pages/shopping-view/checkout";
import ShoppingListing from "./pages/shopping-view/listing";
import ShoppingAbout from "./pages/shopping-view/about";
import CheckAuth from "./components/common/check-auth";
import UnauthPage from "./pages/unauth-page";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./store/auth-slice";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentSuccess from "./pages/paymentSuccess";
import PaymentFailed from "./pages/paymentFailed";
import TermsAndConditions from "./pages/Terms-and-conditions/Terms-and-conditions";
import UserOrders from "./pages/shopping-view/orders";
import BookDetailsPage from "./pages/shopping-view/book-details-page";
import ProductUpload from "./pages/shopping-view/product-upload";
import { ChatProvider } from "./components/chat/ChatContext";
import ChatLayout from "./components/chat/ChatLayout";
import ChatPage from "./components/chat/ChatPage";
import NgrokConfig from "./components/common/ngrok-config";

function App() {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) return <Skeleton className="w-[500px] h-[500px] rounded-full" />;

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden bg-white">
      <ChatProvider> {/* ✅ Wrap everything inside ChatProvider */}
        <Routes>
          {/* Auth Layout */}
          <Route path="/auth" element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
          }>
            <Route path="login" element={<AuthLogin />} />
            <Route path="register" element={<AuthRegister />} />
          </Route>

          {/* Admin Layout */}
          <Route path="/admin" element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }>
            <Route path="auctions" element={<AdminProducts />} />
            <Route path="exchange" element={<AdminOrders />} />
            <Route path="user" element={<AdminUser />} />
          </Route>

          {/* Payment */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />

          {/* Shopping Layout */}
          <Route path="/shop" element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppingLayout />
            </CheckAuth>
          }>
            <Route path="home" element={<ShoppingHome />} />
            <Route path="account" element={<ShoppingAccount />} />
            <Route path="checkout" element={<ShoppingCheckout />} />
            <Route path="listing" element={<ShoppingListing />} />
            <Route path="uploads" element={<ShoppingUploads />} />
            <Route path="about" element={<ShoppingAbout />} />
            <Route path="orders" element={<UserOrders />} />
            <Route path="book/:id" element={<BookDetailsPage />} />
            <Route path="product-upload" element={<ProductUpload />} />
          </Route>

          {/* Chat Layout */}
          <Route path="/chat" element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ChatLayout />
            </CheckAuth>
          }>
            <Route index element={<ChatPage />} />
            <Route path=":chatId" element={<ChatPage />} />
          </Route>

          {/* Misc */}
          <Route path="/unauth-page" element={<UnauthPage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Development helper for ngrok configuration */}
        <NgrokConfig />
      </ChatProvider>
    </div>
  );
}

export default App;
