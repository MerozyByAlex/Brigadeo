import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import { ToastProvider } from './components/ui/ToastProvider';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import Home from './pages/Home';
import ProductInput from './pages/products/ProductInput';
import ProductList from './pages/products/ProductList';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import IngredientList from './pages/ingredients/IngredientList';
import AccountPage from './pages/account/AccountPage';
import RestaurantList from './pages/restaurants/RestaurantList';
import RecipeList from './pages/recipes/RecipeList';
import SuppliersPage from './pages/suppliers/SuppliersPage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="success" element={<Success />} />
          <Route path="cancel" element={<Cancel />} />
          <Route path="/" element={<Layout />}>
            <Route index element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="restaurants" element={
              <PrivateRoute>
                <RestaurantList />
              </PrivateRoute>
            } />
            <Route path="ingredients" element={
              <PrivateRoute>
                <IngredientList />
              </PrivateRoute>
            } />
            <Route path="compte" element={
              <PrivateRoute>
                <AccountPage />
              </PrivateRoute>
            } />
            <Route path="recipes" element={
              <PrivateRoute>
                <RecipeList />
              </PrivateRoute>
            } />
            <Route path="suppliers" element={
              <PrivateRoute>
                <SuppliersPage />
              </PrivateRoute>
            } />
            <Route path="checkout" element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            } />
            <Route path="invoices" element={
              <PrivateRoute>
                <InvoiceListPage />
              </PrivateRoute>
            } />
            <Route path="products" element={
              <PrivateRoute>
                <ProductList />
              </PrivateRoute>
            } />
            <Route path="products/input" element={
              <PrivateRoute>
                <ProductInput />
              </PrivateRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;