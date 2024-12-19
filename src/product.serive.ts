import products from './data.json'; // Adjust the path to your JSON file

export interface ProductI {
  id: number;
  name: string;
  price: number;
  availableCount: number;
}

export interface CheckoutDataI{
  id: number;
  qty: number;
  price: number;
}


export const fetchProducts = (): Promise<ProductI[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(products);
      } catch (error) {
        reject(new Error('Failed to fetch products'));
      }
    }, 1500); // Simulate 1.5 seconds delay
  });
};
