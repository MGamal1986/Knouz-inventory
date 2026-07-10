import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Categories } from "./pages/Categories";
import { Suppliers } from "./pages/Suppliers";
import { Inventory } from "./pages/Inventory";
import { Clients } from "./pages/Clients";
import { Sales } from "./pages/Sales";
import { NewSale } from "./pages/NewSale";
import { InvoicePreview } from "./pages/InvoicePreview";
import { Account } from "./pages/Account";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/products" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/sales/:id/preview" element={<InvoicePreview />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
