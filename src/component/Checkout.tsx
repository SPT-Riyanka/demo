import { LoaderCircle, Minus, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import logo from "../logo.svg";
import { fetchProducts, ProductI } from "../product.service";

const Product: React.FC<{
  product: ProductI;
  onQuantityChange: (id: number, quantity: number) => void;
}> = ({ product, onQuantityChange }) => {
  const handleChange = (quantity: number) => {
    onQuantityChange(product.id, Math.min(Math.max(quantity, 0), product.availableCount));
  };

  return (
    <div className="grid grid-cols-3 items-center mb-4">
      <div>
        <div className="font-medium">{product.name}</div>
        <div className="text-gray-500">Id: {product.id}</div>
        <div className="text-gray-500">Price: ₹{product.price.toFixed(2)}</div>
        <div className="text-gray-400">Available: {product.availableCount}</div>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="icon"
          disabled={product.quantity === 0}
          onClick={() => handleChange((product.quantity || 0) - 1)}
        >
          <Minus size="24" />
        </button>
        <input
          type="number"
          className="w-24 border py-2 px-4 rounded"
          min="0"
          max={product.availableCount}
          value={product.quantity}
          onChange={(e) => handleChange(Number(e.target.value))}
        />
        <button
          className="icon"
          disabled={product.quantity === product.availableCount}
          onClick={() => handleChange((product.quantity || 0) + 1)}
        >
          <Plus size="24" />
        </button>
      </div>
      <div className="flex gap-x-2 items-center justify-end">
        <div className="ml-4 text-xl font-semibold">
          ₹{(product.price * (product.quantity || 0)).toFixed(2)}
        </div>
        <div
          className={`bdge ${product.availableCount <= 5 ? "bg-red-500" : product.availableCount <= 30 ? "bg-orange-500" : "bg-green-500"}`}
        >
          {product.availableCount <= 5 ? "Low" : product.availableCount <= 30 ? "Moderate" : "High"}
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const [products, setProducts] = useState<ProductI[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("price");
  const [sortOrder, setSortOrder] = useState("asc");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [couponApplied, setCouponApplied] = useState(false);


  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data.map((product) => ({ ...product, quantity: 0 })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setProducts(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (id: number, quantity: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, quantity } : product
      )
    );
  };

  // attention
  const saveCart = () => {
    const cartData = JSON.stringify(products);
    if (new Blob([cartData]).size < 5 * 1024 * 1024) {
      localStorage.setItem("cart", cartData);
    } else {
      console.error("Cart data exceeds localStorage size limit");
    }
  };

  const clearCart = () => {
    setProducts((prev) => prev.map((product) => ({ ...product, quantity: 0 })));
  };

  const applyCoupon = () => {
    if (couponCode === "New" && !couponApplied) {
      setCouponApplied(true);
      alert("Coupon applied successfully! Additional 5% discount added.");
    } else if (couponCode !== "New") {
      alert("Invalid coupon code. Please try again.");
    } else {
      alert("Coupon already applied.");
    }
  }

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toString().includes(searchQuery)
    )
    .sort((a, b) => {
      const valueA = a[sortField as keyof ProductI];
      const valueB = b[sortField as keyof ProductI];
      if (valueA === undefined || valueB === undefined) return 0;
      return sortOrder === "asc" ? (valueA > valueB ? 1 : -1) : valueA > valueB ? -1 : 1;
    });

  const subtotal = products.reduce(
    (sum, product) => sum + product.price * (product.quantity || 0),
    0
  );
  const discount =
    subtotal > 2000 ? 20 : subtotal > 1500 ? 15 : subtotal > 1000 ? 10 : 0;
  const additionalDiscount = couponApplied ? 5 : 0;
  // attention: negative value og total because of dicount
  const total = Math.max(0,subtotal * (1 - (discount/100) - (additionalDiscount/100)));

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <img src={logo} alt="Logo" className="h-16" />
        <h1 className="text-3xl font-bold">Cart</h1>
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center my-10">
          <LoaderCircle size="24" className="animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Search"
              className="p-2 border rounded w-1/2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <select
                className="p-2 border rounded"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="id">ID</option>
              </select>
              <select
                className="p-2 border rounded ml-3"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>

            <div>
              <button className="btn-primary bg-blue-500" onClick={saveCart}>
                Save Cart
              </button>
              <button className="btn-primary bg-red-500" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          <div className="text-xl font-semibold mb-4">Products</div>
          <div className="border-b pb-4 mb-4">
            {filteredProducts.map((product) => (
              <Product
                key={product.id}
                product={product}
                onQuantityChange={updateQuantity}
              />
            ))}
          </div>

          <div className="flex flex-col gap-y-4">
            <p className="flex justify-between">
              <strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}
            </p>
            <p className="flex justify-between">
              <strong>Discount ({discount}%):</strong> ₹
              {(subtotal * (discount / 100)).toFixed(2)}
            </p>
            <p className="flex justify-between">
              <strong>Additional Discount ({additionalDiscount}%):</strong> ₹
              {(subtotal * (additionalDiscount / 100)).toFixed(2)}
            </p>
            <p className="flex justify-between">
              <strong>Total:</strong> ₹{total.toFixed(2)}
            </p>
          </div>

          <hr className="my-4" />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter Coupon Code"
              className="p-2 border rounded w-1/2"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button className="btn-primary bg-blue-600" onClick={applyCoupon}>
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
