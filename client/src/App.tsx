import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Menu from "@/pages/menu";
import MenuItemPage from "@/pages/menu-item";
import Tables from "@/pages/tables";
import Orders from "@/pages/orders";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import UserSettings from "@/pages/user-settings";
import CustomerMenu from "@/pages/customer-menu";
import CustomerAuth from "@/pages/customer-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Handle redirects
  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!user && location !== '/login' && !location.startsWith('/menu/table/')) {
        setLocation('/login');
      }
      // Redirect to dashboard if logged in and on login page
      else if (user && location === '/login') {
        setLocation('/dashboard');
      }
      // Redirect root to dashboard
      else if (user && location === '/') {
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, location, setLocation]);
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login">
        {!user ? <Login /> : null}
      </Route>
      
      <Route path="/menu/table/:tableId">
        <CustomerMenu />
      </Route>
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        {user ? (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/menu">
        {user ? (
          <AppLayout>
            <Menu />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/menu/:id">
        {user ? (
          <AppLayout>
            <MenuItemPage />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/tables">
        {user ? (
          <AppLayout>
            <Tables />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/orders">
        {user ? (
          <AppLayout>
            <Orders />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/reports">
        {user && (user.role === 'admin' || user.role === 'manager') ? (
          <AppLayout>
            <Reports />
          </AppLayout>
        ) : null}
      </Route>
      
      <Route path="/settings">
        {user && user.role === 'admin' ? (
          <AppLayout>
            <Settings />
          </AppLayout>
        ) : null}
      </Route>

      <Route path="/user-settings">
        {user ? (
          <AppLayout>
            <UserSettings />
          </AppLayout>
        ) : null}
      </Route>
      
      {/* Root route */}
      <Route path="/">
        {user ? (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        ) : null}
      </Route>
      
      {/* 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;