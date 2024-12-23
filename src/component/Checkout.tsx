import { LoaderCircle, Minus, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import logo from "../logo.svg";
import { CheckoutDataI, fetchProducts, ProductI } from "../product.service";

const Product: React.FC<{
  product: ProductI;
  checkoutData: CheckoutDataI[];
  updateQty: (type: string, product: ProductI, value?: string) => void;
}> = ({ product, checkoutData, updateQty }) => {
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    setQty(checkoutData.find((data) => data.id === product.id)?.qty || 0);
  }, [checkoutData, product.id]);

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
          disabled={qty <= 0}
          onClick={() => updateQty("dec", product)}
        >
          <Minus size="24" />
        </button>
        <input
          type="number"
          className="w-24 border py-2 px-4 rounded"
          min="0"
          max={product.availableCount}
          value={qty}
          onChange={(e) => updateQty("man", product, e.target.value)}
        />
        <button
          className="icon"
          disabled={qty >= product.availableCount}
          onClick={() => updateQty("inc", product)}
        >
          <Plus size="24" />
        </button>
      </div>
      <div className="flex gap-x-2 items-center justify-end">
        <div className="ml-4 text-xl font-semibold">
          ₹{(product.price * qty).toFixed(2)}
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
  const [filterProducts, setFilterProducts] = useState<ProductI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutDataI[]>([]);
  const [sortBy, setSortBy] = useState("price");
  const [sortDir, SetSortDir] = useState("asc");
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [additionDiscount, setAdditionDiscount] = useState(0);
  const [couponcode, setCuoponCode] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetchProducts()
      .then((res: ProductI[]) => {
        setProducts(res);
        setFilterProducts(res);
      })
      .catch(() => {
        console.error("Error retrieving products");
      })
      .finally(() => {
        setIsLoading(false);
        const localStorageData = localStorage.getItem('cart');
        if (localStorageData) {
          setCheckoutData(JSON.parse(localStorageData));
        }
      });
  }, []);

  useEffect(() => {
    let sortedProducts = [...filterProducts];
    sortedProducts.sort((a: ProductI, b: ProductI) => {
      const valA = a[sortBy as keyof ProductI];
      const valB = b[sortBy as keyof ProductI];

      let compare = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        compare = valA - valB;
      } else if (typeof valA === "string" && typeof valB === "string") {
        compare = valA.localeCompare(valB);
      }

      return sortDir === "asc" ? compare : -compare;
    });
    setFilterProducts(sortedProducts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir]);

  useEffect(() => {
    const subtotal = checkoutData.reduce(
      (prev, cur) => prev + cur.price * cur.qty,
      0
    );

    setSubTotal(subtotal);

    if (subtotal > 2000) setDiscount(20);
    else if (subtotal > 1500) setDiscount(15);
    else if (subtotal > 1000) setDiscount(10);
    else setDiscount(0);
  }, [checkoutData]);

  useEffect(() => {
    setTotal(
      subTotal -
        subTotal * (discount / 100) -
        subTotal * (additionDiscount / 100)
    );
  }, [subTotal, discount, additionDiscount]);

  const updateQty = (type: string, product: ProductI, value?: string) => {
    const index = checkoutData.findIndex((d) => d.id === product.id);
  
    if (type === "inc") {
      if (index < 0) {
        setCheckoutData((data) => [...data, { ...product, qty: 1 }]);
      } else {
        setCheckoutData((data) => {
          const updatedData = [...data];
          const currentQty = updatedData[index].qty;
          // Increment by 1, but ensure it's within the available count
          updatedData[index] = {
            ...updatedData[index],
            qty: Math.min(currentQty + 1, product.availableCount),
          };
          return updatedData;
        });
      }
    } else if (type === "dec") {
      setCheckoutData((data) => {
        const updatedData = [...data];
        if (updatedData[index].qty > 1) {
          updatedData[index] = {
            ...updatedData[index],
            qty: updatedData[index].qty - 1,
          };
        } else {
          // Remove item from the list if qty becomes 0
          updatedData.splice(index, 1);
        }
        return updatedData;
      });
    } else if (value && +value >= 0 && +value <= product.availableCount) {
      setCheckoutData((data) => {
        const updateData = [...data];
        if (index >= 0) {
          updateData[index] = { ...updateData[index], qty: +value };
        } else {
          updateData.push({ ...product, qty: +value });
        }
        return updateData;
      });
    }
  };
  

  const filterProduct = (val: string) => {
    const filtered = val.length
      ? products.filter(
          (d) =>
            d.id.toString().includes(val) ||
            d.name.toLowerCase().includes(val.toLowerCase())
        )
      : products;
    setFilterProducts(filtered);
  };

  const updateCart = (type: string) => {
    if (type === 'save') {
      localStorage.setItem('cart', JSON.stringify(checkoutData));
    } else {
      localStorage.removeItem('cart');
      setCheckoutData([]);
    }
  };

  const applyCoupon = () => {
    setAdditionDiscount(couponcode === 'NEW' ? 5 : 0);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <img src={logo} alt="Logo" className="h-16" />
        <h1 className="text-3xl font-bold">Cart</h1>
      </div>

      {isLoading ? (
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
              onChange={(e) => filterProduct(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <select
                className="p-2 border rounded"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="id">ID</option>
              </select>
              <select
                className="p-2 border rounded ml-3"
                value={sortDir}
                onChange={(e) => SetSortDir(e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>

            <div>
              <button className="btn-primary bg-blue-500" onClick={() => updateCart('save')}>
                Save Cart
              </button>
              <button className="btn-primary bg-red-500" onClick={() => updateCart('clear')}>
                Clear Cart
              </button>
            </div>
          </div>

          <div className="text-xl font-semibold mb-4">Products</div>
          <div className="border-b pb-4 mb-4">
            {filterProducts.map((product) => (
              <Product
                key={product.id}
                product={product}
                checkoutData={checkoutData}
                updateQty={updateQty}
              />
            ))}
          </div>

          <div className="flex flex-col gap-y-4">
            <p className="flex justify-between">
              <strong>Subtotal:</strong> ₹{subTotal.toFixed(2)}
            </p>
            <p className="flex justify-between">
              <strong>Discount ({discount}%):</strong> ₹
              {(subTotal * (discount / 100)).toFixed(2)}
            </p>
            <p className="flex justify-between">
              <strong>Additional Discount ({additionDiscount}%):</strong> ₹
              {(subTotal * (additionDiscount / 100)).toFixed(2)}
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
              value={couponcode}
              onChange={(e) => setCuoponCode(e.target.value)}
            />
            <button className="btn-primary bg-blue-600" onClick={applyCoupon}>
              Apply
            </button>
          </div>
          <p>{couponcode.length > 0 && couponcode !== 'NEW' && additionDiscount === 0 && "Invalid coupon"}</p>
        </div>
      )}
    </>
  );
};

export default Checkout;
