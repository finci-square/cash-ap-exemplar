import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import CheckoutPage from './CheckoutPage'
import './App.css'

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sku: string;
}

interface Cart {
  id: string;
  sessionId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function Home() {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [cartMessage, setCartMessage] = useState<string>('');

  const backendUrl = 'http://localhost:3000';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/items`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const data: { items: Item[] } = await response.json();

      // Get the first item
      if (data.items && data.items.length > 0) {
        setItem(data.items[0]);
      } else {
        setError('No items available');
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!item) return;

    try {
      setAddingToCart(true);
      setCartMessage('');

      const response = await fetch(`${backendUrl}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: item.id
        })
      });

      if (!response.ok) {
        const errorData: { error?: { message: string } } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to add item to cart');
      }

      const data: { cart: Cart } = await response.json();
      setCartMessage(`Added to cart! Total: $${(data.cart.total / 100).toFixed(2)}`);
      setAddingToCart(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>E-Commerce Demo</h1>
        <p>Loading items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>E-Commerce Demo</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1>E-Commerce Demo</h1>
      </div>

      {item && (
        <div className="item-card">
          <img src={item.imageUrl} alt={item.name} className="item-image" />
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p className="item-price">${(item.price / 100).toFixed(2)}</p>
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="add-to-cart-button"
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          {cartMessage && <p className="cart-message">{cartMessage}</p>}
        </div>
      )}

      <div className="payment-links">
        <Link to="/checkout">
          <button className="pay-button">Checkout</button>
        </Link>
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Router>
  )
}

export default App
