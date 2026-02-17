# Cash App Pay & Afterpay Exemplar - Project Plan

## Project Status

This document tracks the implementation plan and progress for the Cash App Pay & Afterpay exemplar application.

---

## Current Implementation Status

### ✅ Completed
- Backend Fastify server setup
- Cart API endpoints
- Cash App Pay integration (basic implementation)
- Session management
- Database schema (SQLite)

### 🚧 In Progress
- Frontend checkout flow improvements

---

## Frontend Development Plan

### 1. Checkout Page Redesign

**Status:** Planned
**Priority:** High
**Description:**

Create a new single-column checkout page with improved UX:

#### Layout Structure
- **Single column format** optimized for all screen sizes
- **First half (top section):** Cart display
  - Show all items in cart
  - Display item details (name, quantity, price)
  - Show subtotal, taxes (if applicable), and total
  - Allow quantity adjustments
  - Allow item removal
  - Empty cart state handling

- **Second half (bottom section):** Payment method selection
  - **Cash App Pay option**
    - Cash App Pay button
    - QR code for mobile scanning
    - Clear payment flow

  - **Afterpay option**
    - Afterpay button with branding
    - Installment breakdown display
    - "Pay in 4" messaging
    - Link to Afterpay terms

#### Technical Requirements
- Responsive design (mobile-first)
- Clean component structure
- Loading states for payment initialization
- Error handling and display
- Integration with existing backend APIs:
  - `GET /cart` - fetch cart data
  - `POST /cart/checkout/afterpay` - initiate Afterpay checkout
  - `POST /cart/checkout/cash-app-pay` - initiate Cash App Pay checkout

#### Design Considerations
- Use Base Web components for consistency
- Follow payment provider brand guidelines
- Clear visual separation between cart and payment sections
- Accessible (WCAG 2.1 AA compliant)
- Smooth transitions and animations

#### Implementation Steps
1. Create new `CheckoutPage.tsx` component (or refactor existing)
2. Create cart display component (`CartSummary.tsx`)
3. Create payment options component (`PaymentSelector.tsx`)
4. Implement Cash App Pay integration
5. Implement Afterpay integration
6. Add error handling and loading states
7. Style with responsive CSS
8. Test on multiple devices and screen sizes

#### Related Files
- `frontend/src/CheckoutPage.tsx` (exists - needs redesign)
- `frontend/src/CheckoutPage.css` (exists - needs update)
- `frontend/src/App.tsx` (routing)

---

### 2. Shopping Cart Page

**Status:** Not Started
**Priority:** Medium
**Description:**

Create a dedicated cart management page where users can:
- View all items in cart
- Update quantities
- Remove items
- See running total
- Proceed to checkout
- Continue shopping

---

### 3. Product Catalog Page

**Status:** Not Started
**Priority:** Medium
**Description:**

Create a product listing page with:
- Grid/list view of products
- Product images
- Prices
- "Add to Cart" functionality
- Product details
- Sample products (5-10 items)

---

### 4. Order Confirmation Page

**Status:** Not Started
**Priority:** Medium
**Description:**

Create a post-payment confirmation page showing:
- Order summary
- Payment confirmation
- Order number
- Receipt details
- Next steps

---

### 5. Payment Result Page

**Status:** Not Started
**Priority:** High
**Description:**

Create a unified payment result page that handles:
- Success states (Cash App Pay, Afterpay)
- Failure states with error messages
- Pending states
- Redirect logic based on payment provider

---

## Backend Development Plan

### 1. Enhanced Cart Management

**Status:** Partially Complete
**Priority:** High
**Tasks:**
- [ ] Add endpoint for updating item quantities
- [ ] Add endpoint for removing items
- [ ] Add cart expiration logic
- [ ] Add cart validation before checkout

### 2. Payment Provider Integration

**Status:** In Progress
**Priority:** High

#### Cash App Pay
- [x] Basic integration
- [ ] Webhook handling
- [ ] Payment capture
- [ ] Refund support
- [ ] Error handling improvements

#### Afterpay
- [x] Basic checkout creation
- [ ] Payment capture after authorization
- [ ] Webhook handling
- [ ] Refund support
- [ ] Installment plan details API

---

## Database Schema Updates

### Planned Improvements
- [ ] Add `cart_items` join table for proper many-to-many relationship
- [ ] Add `products` table for product catalog
- [ ] Add proper indexes for performance
- [ ] Add `orders` table for completed purchases
- [ ] Add `webhook_events` table for audit trail

---

## Testing Plan

### Frontend Testing
- [ ] Unit tests for components
- [ ] Integration tests for checkout flow
- [ ] E2E tests with Playwright/Cypress
- [ ] Cross-browser testing
- [ ] Mobile device testing

### Backend Testing
- [ ] Unit tests for business logic
- [ ] API endpoint tests
- [ ] Webhook testing
- [ ] Payment flow integration tests
- [ ] Error scenario testing

---

## Documentation Tasks

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Frontend component documentation
- [ ] Setup/installation guide
- [ ] Environment configuration guide
- [ ] Payment provider integration guide
- [ ] Troubleshooting guide

---

## Infrastructure & DevOps

- [ ] Environment variable management
- [ ] CI/CD pipeline setup
- [ ] Staging environment setup
- [ ] Monitoring and logging setup
- [ ] Error tracking (Sentry or similar)

---

## Next Steps (Priority Order)

1. **Redesign Checkout Page** (this document, Section 1)
   - Single column layout
   - Cart display (top half)
   - Payment options (bottom half)

2. **Implement Payment Result Page**
   - Handle success/failure states
   - Provider-specific handling

3. **Create Product Catalog**
   - Sample products
   - Add to cart functionality

4. **Complete Backend Payment Integration**
   - Webhook handling
   - Payment capture
   - Refunds

5. **Add Comprehensive Testing**
   - E2E tests
   - Payment flow tests

---

## Notes

- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Maintain consistency with Base Web design system
- Keep security best practices in mind
- Use sandbox/test mode for all payment providers
- Document all API changes
