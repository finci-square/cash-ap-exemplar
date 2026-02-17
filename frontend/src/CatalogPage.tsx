import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './CatalogPage.css';

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

type ViewMode = 'grid' | 'list';

const BACKEND_URL = 'http://localhost:3000';

function CatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());
  const [cartItemCount, setCartItemCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/items`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: { items: Item[] } = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/cart`, {
        credentials: 'include',
      });

      if (!response.ok) return;

      const data: { cart: Cart | null } = await response.json();
      if (data.cart) {
        const count = data.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(count);
      }
    } catch {
      // Silently fail for cart fetch
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCart();
  }, [fetchItems, fetchCart]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2500);
  };

  const addToCart = async (item: Item) => {
    try {
      setAddingItemId(item.id);

      const response = await fetch(`${BACKEND_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: item.id }),
      });

      if (!response.ok) {
        const errorData: { error?: { message: string } } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to add item to cart');
      }

      const data: { cart: Cart } = await response.json();
      const count = data.cart.items.reduce((sum, ci) => sum + ci.quantity, 0);
      setCartItemCount(count);

      setAddedItemIds((prev) => new Set(prev).add(item.id));
      showToast(`${item.name} added to cart`);
      setTimeout(() => {
        setAddedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAddingItemId(null);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="catalog-page">
        <div className="catalog-loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page">
        <div className="catalog-error">
          <p>Error: {error}</p>
          <button onClick={fetchItems}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Products</h1>
        <div className="catalog-header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              List
            </button>
          </div>
          <Link to="/checkout" className="cart-link">
            Cart
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'product-grid' : 'product-list'}>
        {items.map((item) => (
          <div key={item.id} className="product-card">
            <div className="product-image-container">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="product-image"
                loading="lazy"
              />
            </div>
            <div className="product-info">
              <h3 className="product-name">{item.name}</h3>
              <p className="product-description">{item.description}</p>
              <p className="product-sku">SKU: {item.sku}</p>
              <div className="product-footer">
                <span className="product-price">{formatPrice(item.price)}</span>
                <button
                  className={`add-to-cart-btn ${addedItemIds.has(item.id) ? 'added' : ''}`}
                  onClick={() => addToCart(item)}
                  disabled={addingItemId === item.id}
                >
                  {addingItemId === item.id
                    ? 'Adding...'
                    : addedItemIds.has(item.id)
                      ? 'Added!'
                      : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="catalog-empty">
          <p>No products available.</p>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default CatalogPage;
