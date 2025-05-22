import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import { ToastProvider } from './components/ui/ToastProvider';
import Home from './pages/Home';
import ProductInput from './pages/products/ProductInput';
import ProductList from './pages/products/ProductList';
import IngredientList from './pages/ingredients/IngredientList';
import TestBack from './pages/TestBack';
import InvoiceList from './pages/invoices/InvoiceList';
import RecipeList from './pages/recipes/RecipeList';
import RestaurantList from './pages/restaurants/RestaurantList';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
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
          <Route path="recettes" element={
            <PrivateRoute>
              <RecipeList />
            </PrivateRoute>
          } />
          <Route path="produits" element={
            <PrivateRoute>
              <ProductList />
            </PrivateRoute>
          } />
          <Route path="factures" element={
            <PrivateRoute>
              <InvoiceList />
            </PrivateRoute>
          } />
          <Route path="produits/saisie" element={
            <PrivateRoute>
              <ProductInput />
            </PrivateRoute>
          } />
          <Route path="test-back" element={
            <PrivateRoute>
              <TestBack />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App