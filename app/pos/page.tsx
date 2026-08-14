// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import { getSession } from 'next-auth/react';
// import {
//   Search,
//   ShoppingCart,
//   Trash2,
//   Plus,
//   Minus,
//   CreditCard,
//   Banknote,
//   Landmark,
//   CheckCircle2,
// } from 'lucide-react';

// import { getPosCatalog, processSale } from '@/app/actions/pos';

// interface Product {
//   id: string;
//   sku: string;
//   name: string;
//   category: string;
//   stock: number;
//   sellingPrice: number;
// }

// interface CartItem {
//   product: Product;
//   quantity: number;
// }

// type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

// export default function SalesAssistantPage() {
//   // =========================================================
//   // PRODUCTS / DATABASE
//   // =========================================================

//   const [products, setProducts] = useState<Product[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadError, setLoadError] = useState('');

//   // =========================================================
//   // SESSION
//   // =========================================================

//   /*
//    * IMPORTANT:
//    * Replace this with the actual logged-in user's ID
//    * from your NextAuth session.
//    *
//    * For now this is a placeholder so the component can
//    * compile while we connect the authentication properly.
//    */
//   const [staffId, setStaffId] = useState<string | null>(null);
//   const [staffName, setStaffName] = useState('Loading...');
//   useEffect(() => {
//     async function loadSession() {
//       const session = await getSession();

//       console.log('POS SESSION:', session);

//       if (!session?.user?.id) {
//         console.error('No logged-in staff ID found');
//         return;
//       }

//       setStaffId(session.user.id);
//       setStaffName(session.user.name || 'Sales Assistant');
//     }

//     loadSession();
//   }, []);
//   // =========================================================
//   // POS STATE
//   // =========================================================

//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [cart, setCart] = useState<CartItem[]>([]);

//   // =========================================================
//   // CHECKOUT STATE
//   // =========================================================

//   const [showCheckout, setShowCheckout] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

//   const [amountTendered, setAmountTendered] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);

//   const [isProcessingSale, setIsProcessingSale] = useState(false);
//   const [saleError, setSaleError] = useState('');
//   const [completedSaleTotal, setCompletedSaleTotal] = useState(0);

//   // =========================================================
//   // LOAD PRODUCTS
//   // =========================================================

//   useEffect(() => {
//     async function loadProducts() {
//       try {
//         setIsLoading(true);
//         setLoadError('');

//         const result = await getPosCatalog();

//         if (result.success) {
//           setProducts(result.data ?? []);
//         } else {
//           setLoadError(result.error ?? 'Failed to load POS catalog');
//         }
//       } catch (error) {
//         console.error('Failed to load POS catalog:', error);
//         setLoadError('Failed to load products.');
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     loadProducts();
//   }, []);

//   // =========================================================
//   // CATEGORIES
//   // =========================================================

//   const categories = useMemo(() => {
//     return [
//       'All',
//       ...Array.from(new Set(products.map((product) => product.category))),
//     ];
//   }, [products]);

//   // =========================================================
//   // FILTER PRODUCTS
//   // =========================================================

//   const filteredProducts = useMemo(() => {
//     return products.filter((product) => {
//       const search = searchQuery.toLowerCase();

//       const matchesSearch =
//         product.name.toLowerCase().includes(search) ||
//         product.sku.toLowerCase().includes(search);

//       const matchesCategory =
//         selectedCategory === 'All' || product.category === selectedCategory;

//       return matchesSearch && matchesCategory;
//     });
//   }, [products, searchQuery, selectedCategory]);

//   // =========================================================
//   // CART CALCULATIONS
//   // =========================================================

//   const cartSubtotal = useMemo(() => {
//     return cart.reduce(
//       (sum, item) => sum + item.product.sellingPrice * item.quantity,
//       0,
//     );
//   }, [cart]);

//   /*
//    * Your original POS used 5% tax.
//    *
//    * However, your backend processSale() currently calculates
//    * the order total using ONLY item price × quantity.
//    *
//    * Therefore, we should NOT add tax here yet.
//    *
//    * This keeps frontend total === backend total.
//    */
//   const tax = 0;

//   const cartTotal = cartSubtotal + tax;

//   const changeDue =
//     paymentMethod === 'CASH' && amountTendered
//       ? Math.max(0, Number(amountTendered) - cartTotal)
//       : 0;

//   // =========================================================
//   // ADD TO CART
//   // =========================================================

//   const addToCart = (product: Product) => {
//     if (product.stock <= 0) {
//       return;
//     }

//     setCart((previousCart) => {
//       const existingItem = previousCart.find(
//         (item) => item.product.id === product.id,
//       );

//       if (existingItem) {
//         if (existingItem.quantity >= product.stock) {
//           return previousCart;
//         }

//         return previousCart.map((item) =>
//           item.product.id === product.id
//             ? {
//                 ...item,
//                 quantity: item.quantity + 1,
//               }
//             : item,
//         );
//       }

//       return [
//         ...previousCart,
//         {
//           product,
//           quantity: 1,
//         },
//       ];
//     });
//   };

//   // =========================================================
//   // UPDATE QUANTITY
//   // =========================================================

//   const updateQuantity = (productId: string, delta: number) => {
//     setCart((previousCart) =>
//       previousCart
//         .map((item) => {
//           if (item.product.id !== productId) {
//             return item;
//           }

//           const newQuantity = item.quantity + delta;

//           if (newQuantity <= 0) {
//             return null;
//           }

//           if (newQuantity > item.product.stock) {
//             return item;
//           }

//           return {
//             ...item,
//             quantity: newQuantity,
//           };
//         })
//         .filter((item): item is CartItem => item !== null),
//     );
//   };

//   // =========================================================
//   // REMOVE FROM CART
//   // =========================================================

//   const removeFromCart = (productId: string) => {
//     setCart((previousCart) =>
//       previousCart.filter((item) => item.product.id !== productId),
//     );
//   };

//   // =========================================================
//   // OPEN CHECKOUT
//   // =========================================================

//   const openCheckout = () => {
//     if (cart.length === 0) {
//       return;
//     }

//     setSaleError('');
//     setShowCheckout(true);
//   };

//   // =========================================================
//   // COMPLETE SALE
//   // =========================================================

//   const handleCompleteSale = async () => {
//     if (cart.length === 0) {
//       return;
//     }

//     if (!staffId) {
//       setSaleError('Unable to identify the logged-in staff member.');
//       return;
//     }

//     if (
//       paymentMethod === 'CASH' &&
//       (!amountTendered || Number(amountTendered) < cartTotal)
//     ) {
//       setSaleError('Amount tendered is less than the total amount.');
//       return;
//     }

//     try {
//       setIsProcessingSale(true);
//       setSaleError('');

//       const result = await processSale({
//         staffId,

//         paymentMethod,

//         items: cart.map((item) => ({
//           productId: item.product.id,
//           quantity: item.quantity,

//           /*
//            * IMPORTANT:
//            * Send the actual selling price from the
//            * database-backed product.
//            */
//           price: item.product.sellingPrice,
//         })),
//       });

//       if (!result.success) {
//         setSaleError(result.error || 'Failed to process sale.');
//         return;
//       }

//       /*
//        * The transaction was successful.
//        *
//        * Refresh the catalog from the database so the
//        * displayed stock is accurate.
//        */
//       const catalogResult = await getPosCatalog();

//       if (catalogResult.success) {
//         setProducts(catalogResult.data ?? []);
//       }

//       setCart([]);
//       setAmountTendered('');
//       setCompletedSaleTotal(cartTotal);
//       setShowCheckout(false);
//       setShowSuccess(true);
//     } catch (error) {
//       console.error('Error processing sale:', error);

//       setSaleError('An unexpected error occurred while processing the sale.');
//     } finally {
//       setIsProcessingSale(false);
//     }
//   };

//   // =========================================================
//   // RESET TERMINAL
//   // =========================================================

//   const resetTerminal = () => {
//     setCart([]);
//     setAmountTendered('');
//     setShowSuccess(false);
//     setShowCheckout(false);
//     setSaleError('');
//     setSearchQuery('');
//     setSelectedCategory('All');
//   };

//   // =========================================================
//   // LOADING
//   // =========================================================

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-100">
//         <div className="text-center">
//           <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

//           <p className="text-slate-600 font-medium">Loading POS...</p>
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // ERROR
//   // =========================================================

//   if (loadError) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md">
//           <h2 className="text-xl font-bold text-red-600 mb-2">
//             Unable to Load POS
//           </h2>

//           <p className="text-slate-600 mb-6">{loadError}</p>

//           <button
//             onClick={() => window.location.reload()}
//             className="px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // MAIN POS
//   // =========================================================

//   return (
//     <div className="h-screen flex bg-slate-100 overflow-hidden">
//       {/* =====================================================
//           LEFT PANEL
//       ====================================================== */}

//       <main className="flex-1 flex flex-col min-w-0">
//         {/* HEADER */}

//         <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shrink-0">
//           <div>
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
//                 <ShoppingCart size={22} />
//               </div>

//               <div>
//                 <h1 className="text-xl font-bold text-slate-900">
//                   Point of Sale
//                 </h1>

//                 <p className="text-sm text-slate-500">Store Front Terminal</p>
//               </div>
//             </div>
//           </div>

//           <div className="text-right">
//             <p className="text-xs text-slate-400 uppercase tracking-wider">
//               Logged in as
//             </p>

//             <p className="font-bold text-slate-900">{staffName}</p>
//           </div>
//         </header>

//         {/* SEARCH / FILTERS */}

//         <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
//           <div className="relative">
//             <Search
//               className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
//               size={20}
//             />

//             <input
//               type="text"
//               placeholder="Search products by name or SKU..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-12 pr-4 py-3.5 rounded-xl border-0 ring-1 ring-slate-200 shadow-sm text-base focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
//             />
//           </div>

//           <div className="flex gap-2 overflow-x-auto pb-1">
//             {categories.map((category) => (
//               <button
//                 key={category}
//                 onClick={() => setSelectedCategory(category)}
//                 className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
//                   selectedCategory === category
//                     ? 'bg-slate-900 text-white border-slate-900'
//                     : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
//                 }`}
//               >
//                 {category}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* PRODUCT GRID */}

//         <div className="flex-1 overflow-y-auto p-6">
//           {filteredProducts.length === 0 ? (
//             <div className="h-full flex items-center justify-center">
//               <div className="text-center text-slate-400">
//                 <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />

//                 <p className="font-medium">No products found.</p>
//               </div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
//               {filteredProducts.map((product) => {
//                 const isOutOfStock = product.stock <= 0;

//                 return (
//                   <button
//                     key={product.id}
//                     type="button"
//                     onClick={() => addToCart(product)}
//                     disabled={isOutOfStock}
//                     className={`relative p-4 rounded-2xl border text-left transition-all duration-200 select-none flex flex-col justify-between h-40 ${
//                       isOutOfStock
//                         ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
//                         : 'bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 active:scale-95'
//                     }`}
//                   >
//                     <div>
//                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
//                         {product.category}
//                       </span>

//                       <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">
//                         {product.name}
//                       </h3>

//                       <p className="text-[10px] text-slate-400 mt-1">
//                         SKU: {product.sku}
//                       </p>
//                     </div>

//                     <div className="flex items-end justify-between mt-4">
//                       <span className="text-lg font-black text-slate-900">
//                         ₦{product.sellingPrice.toFixed(2)}
//                       </span>

//                       {isOutOfStock ? (
//                         <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
//                           Out of Stock
//                         </span>
//                       ) : (
//                         <span className="text-xs font-medium text-emerald-600">
//                           {product.stock} in stock
//                         </span>
//                       )}
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* =====================================================
//           RIGHT CART PANEL
//       ====================================================== */}

//       <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-10 shrink-0">
//         {/* CART HEADER */}

//         <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
//           <ShoppingCart className="text-slate-700" size={24} />

//           <h2 className="text-xl font-bold text-slate-900">Current Order</h2>

//           <span className="ml-auto bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">
//             {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
//           </span>
//         </div>

//         {/* CART ITEMS */}

//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {cart.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
//               <ShoppingCart size={48} className="opacity-20" />

//               <p>Tap products to add to cart</p>
//             </div>
//           ) : (
//             cart.map((item) => (
//               <div
//                 key={item.product.id}
//                 className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-3"
//               >
//                 <div className="flex-1 min-w-0">
//                   <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
//                     {item.product.name}
//                   </h4>

//                   <p className="text-indigo-600 font-bold text-sm mt-1">
//                     ₦{item.product.sellingPrice.toFixed(2)}
//                   </p>
//                 </div>

//                 {/* QUANTITY */}

//                 <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
//                   <button
//                     type="button"
//                     onClick={() => updateQuantity(item.product.id, -1)}
//                     disabled={item.quantity <= 1}
//                     className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40"
//                   >
//                     <Minus size={16} />
//                   </button>

//                   <span className="w-4 text-center font-bold text-sm text-slate-900">
//                     {item.quantity}
//                   </span>

//                   <button
//                     type="button"
//                     onClick={() => updateQuantity(item.product.id, 1)}
//                     disabled={item.quantity >= item.product.stock}
//                     className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40"
//                   >
//                     <Plus size={16} />
//                   </button>
//                 </div>

//                 {/* DELETE */}

//                 <button
//                   type="button"
//                   onClick={() => removeFromCart(item.product.id)}
//                   className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
//                 >
//                   <Trash2 size={18} />
//                 </button>
//               </div>
//             ))
//           )}
//         </div>

//         {/* TOTALS */}

//         <div className="p-6 bg-slate-50 border-t border-slate-200">
//           <div className="space-y-2 mb-6">
//             <div className="flex justify-between text-slate-500 text-sm">
//               <span>Subtotal</span>
//               <span> ₦{cartSubtotal.toFixed(2)}</span>
//             </div>

//             <div className="flex justify-between text-slate-500 text-sm">
//               <span>Tax</span>
//               <span>₦{tax.toFixed(2)}</span>
//             </div>

//             <div className="flex justify-between text-slate-900 text-2xl font-black pt-4 border-t border-slate-200">
//               <span>Total</span>

//               <span> ₦{cartTotal.toFixed(2)}</span>
//             </div>
//           </div>

//           <button
//             onClick={openCheckout}
//             disabled={cart.length === 0}
//             className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
//           >
//             Charge ₦{cartTotal.toFixed(2)}
//           </button>
//         </div>
//       </aside>

//       {/* =====================================================
//           CHECKOUT MODAL
//       ====================================================== */}

//       {showCheckout && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
//             {/* HEADER */}

//             <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
//               <h2 className="text-xl font-bold text-slate-900">
//                 Complete Payment
//               </h2>

//               <button
//                 type="button"
//                 onClick={() => setShowCheckout(false)}
//                 className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="p-6 space-y-6">
//               {/* AMOUNT */}

//               <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
//                 <p className="text-indigo-600 font-medium text-sm mb-1">
//                   Amount Due
//                 </p>

//                 <p className="text-4xl font-black text-indigo-900">
//                   ₦{cartTotal.toFixed(2)}
//                 </p>
//               </div>

//               {/* ERROR */}

//               {saleError && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
//                   {saleError}
//                 </div>
//               )}

//               {/* PAYMENT METHOD */}

//               <div>
//                 <p className="text-sm font-semibold text-slate-900 mb-3">
//                   Select Method
//                 </p>

//                 <div className="grid grid-cols-3 gap-3">
//                   {/* CASH */}

//                   <button
//                     type="button"
//                     onClick={() => setPaymentMethod('CASH')}
//                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
//                       paymentMethod === 'CASH'
//                         ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
//                         : 'border-slate-200 text-slate-500 hover:border-slate-300'
//                     }`}
//                   >
//                     <Banknote size={24} />

//                     <span className="font-bold text-sm">Cash</span>
//                   </button>

//                   {/* CARD */}

//                   <button
//                     type="button"
//                     onClick={() => setPaymentMethod('CARD')}
//                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
//                       paymentMethod === 'CARD'
//                         ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
//                         : 'border-slate-200 text-slate-500 hover:border-slate-300'
//                     }`}
//                   >
//                     <CreditCard size={24} />

//                     <span className="font-bold text-sm">Card POS</span>
//                   </button>

//                   {/* TRANSFER */}

//                   <button
//                     type="button"
//                     onClick={() => setPaymentMethod('TRANSFER')}
//                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
//                       paymentMethod === 'TRANSFER'
//                         ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
//                         : 'border-slate-200 text-slate-500 hover:border-slate-300'
//                     }`}
//                   >
//                     <Landmark size={24} />

//                     <span className="font-bold text-sm">Transfer</span>
//                   </button>
//                 </div>
//               </div>

//               {/* CASH */}

//               {paymentMethod === 'CASH' && (
//                 <div className="space-y-4 pt-2 border-t border-slate-100">
//                   <div>
//                     <label className="text-sm font-semibold text-slate-900 block mb-2">
//                       Amount Tendered
//                     </label>

//                     <div className="relative">
//                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
//                         ₦
//                       </span>

//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={amountTendered}
//                         onChange={(e) => setAmountTendered(e.target.value)}
//                         placeholder="0.00"
//                         className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
//                       />
//                     </div>
//                   </div>

//                   <div className="flex justify-between items-center p-4 bg-slate-100 rounded-xl">
//                     <span className="text-slate-600 font-medium">
//                       Change Due
//                     </span>

//                     <span
//                       className={`text-2xl font-black ${
//                         changeDue > 0 ? 'text-emerald-600' : 'text-slate-400'
//                       }`}
//                     >
//                       ₦{changeDue.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* CONFIRM */}

//             <div className="p-6 border-t border-slate-100 bg-slate-50">
//               <button
//                 type="button"
//                 onClick={handleCompleteSale}
//                 disabled={
//                   isProcessingSale ||
//                   (paymentMethod === 'CASH' &&
//                     (!amountTendered || Number(amountTendered) < cartTotal))
//                 }
//                 className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
//               >
//                 {isProcessingSale
//                   ? 'Processing Sale...'
//                   : 'Confirm & Print Receipt'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           SUCCESS MODAL
//       ====================================================== */}

//       {showSuccess && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-8">
//             <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
//               <CheckCircle2 size={40} className="text-emerald-600" />
//             </div>

//             <h2 className="text-2xl font-black text-slate-900 mb-2">
//               Sale Complete!
//             </h2>

//             <p className="text-slate-500 mb-8">
//               Transaction has been recorded successfully.
//             </p>

//             <div className="w-full bg-slate-50 rounded-xl p-4 mb-6">
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">Total</span>

//                 <span className="font-bold text-slate-900">
//                   ₦{completedSaleTotal.toFixed(2)}
//                 </span>
//               </div>

//               <div className="flex justify-between text-sm mt-2">
//                 <span className="text-slate-500">Payment</span>

//                 <span className="font-bold text-slate-900">
//                   {paymentMethod}
//                 </span>
//               </div>
//             </div>

//             <button
//               onClick={resetTerminal}
//               className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all"
//             >
//               Start New Sale
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSession } from 'next-auth/react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

import { getPosCatalog, processSale } from '@/app/actions/pos';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  sellingPrice: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export default function SalesAssistantPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('Loading...');

  useEffect(() => {
    async function loadSession() {
      const session = await getSession();
      if (!session?.user?.id) {
        return;
      }
      setStaffId(session.user.id);
      setStaffName(session.user.name || 'Sales Assistant');
    }
    loadSession();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const [amountTendered, setAmountTendered] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [completedSaleTotal, setCompletedSaleTotal] = useState(0);

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        setLoadError('');
        const result = await getPosCatalog();
        if (result.success) {
          setProducts(result.data ?? []);
        } else {
          setLoadError(result.error ?? 'Failed to load POS catalog');
        }
      } catch (error) {
        setLoadError('Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(new Set(products.map((product) => product.category))),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search);
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0,
    );
  }, [cart]);

  const tax = 0;
  const cartTotal = cartSubtotal + tax;

  const changeDue =
    paymentMethod === 'CASH' && amountTendered
      ? Math.max(0, Number(amountTendered) - cartTotal)
      : 0;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      return;
    }
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.product.id === product.id,
      );
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return previousCart;
        }
        return previousCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }
      return [
        ...previousCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          if (newQuantity > item.product.stock) {
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.product.id !== productId),
    );
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      return;
    }
    setSaleError('');
    setShowCheckout(true);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (!staffId) {
      setSaleError('Unable to identify the logged-in staff member.');
      return;
    }
    if (
      paymentMethod === 'CASH' &&
      (!amountTendered || Number(amountTendered) < cartTotal)
    ) {
      setSaleError('Amount tendered is less than the total amount.');
      return;
    }

    try {
      setIsProcessingSale(true);
      setSaleError('');
      const result = await processSale({
        staffId,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.sellingPrice,
        })),
      });

      if (!result.success) {
        setSaleError(result.error || 'Failed to process sale.');
        return;
      }

      const catalogResult = await getPosCatalog();
      if (catalogResult.success) {
        setProducts(catalogResult.data ?? []);
      }

      setCart([]);
      setAmountTendered('');
      setCompletedSaleTotal(cartTotal);
      setShowCheckout(false);
      setShowSuccess(true);
    } catch (error) {
      setSaleError('An unexpected error occurred while processing the sale.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const resetTerminal = () => {
    setCart([]);
    setAmountTendered('');
    setShowSuccess(false);
    setShowCheckout(false);
    setSaleError('');
    setSearchQuery('');
    setSelectedCategory('All');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Unable to Load POS
          </h2>
          <p className="text-slate-600 mb-6">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-100 overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 lg:px-6 lg:py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-900 leading-tight">
                  Point of Sale
                </h1>
                <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">
                  Store Front Terminal
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-sm lg:text-base font-bold text-slate-900 truncate max-w-[120px] sm:max-w-xs">
              {staffName}
            </p>
          </div>
        </header>

        <div className="p-4 lg:p-6 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3 lg:space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3.5 rounded-xl border-0 ring-1 ring-slate-200 shadow-sm text-sm lg:text-base focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No products found.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative p-3 lg:p-4 rounded-xl lg:rounded-2xl border text-left transition-all duration-200 select-none flex flex-col justify-between h-36 lg:h-40 ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 active:scale-95'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-sm lg:text-base text-slate-900 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-[9px] lg:text-[10px] text-slate-400 mt-1 truncate">
                        SKU: {product.sku}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-2 lg:mt-4">
                      <span className="text-base lg:text-lg font-black text-slate-900">
                        ₦{product.sellingPrice.toFixed(0)}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[10px] lg:text-xs font-bold text-rose-600 bg-rose-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md">
                          Out
                        </span>
                      ) : (
                        <span className="text-[10px] lg:text-xs font-medium text-emerald-600">
                          {product.stock} left
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <aside className="w-full h-[45vh] lg:h-auto lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] lg:shadow-xl z-10 shrink-0">
        <div className="p-4 lg:p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2 lg:gap-3 shrink-0">
          <ShoppingCart className="text-slate-700 w-5 h-5 lg:w-6 lg:h-6" />
          <h2 className="text-lg lg:text-xl font-bold text-slate-900">
            Current Order
          </h2>
          <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs lg:text-sm font-bold px-2 lg:px-3 py-1 rounded-full">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 lg:space-y-4">
              <ShoppingCart size={36} className="opacity-20" />
              <p className="text-sm lg:text-base">
                Tap products to add to cart
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 lg:p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2 lg:gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs lg:text-sm leading-tight truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-indigo-600 font-bold text-xs lg:text-sm mt-0.5 lg:mt-1">
                    ₦{item.product.sellingPrice.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 lg:gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    disabled={item.quantity <= 1}
                    className="p-1 lg:p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40"
                  >
                    <Minus size={14} className="lg:w-4 lg:h-4" />
                  </button>
                  <span className="w-4 lg:w-5 text-center font-bold text-xs lg:text-sm text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="p-1 lg:p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40"
                  >
                    <Plus size={14} className="lg:w-4 lg:h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 lg:p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-6 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-6">
            <div className="flex justify-between text-slate-500 text-xs lg:text-sm">
              <span>Subtotal</span>
              <span> ₦{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs lg:text-sm">
              <span>Tax</span>
              <span>₦{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 text-xl lg:text-2xl font-black pt-2 lg:pt-4 border-t border-slate-200">
              <span>Total</span>
              <span> ₦{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={openCheckout}
            disabled={cart.length === 0}
            className="w-full bg-slate-900 text-white font-bold text-base lg:text-lg py-3 lg:py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Charge ₦{cartTotal.toFixed(2)}
          </button>
        </div>
      </aside>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                Complete Payment
              </h2>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto">
              <div className="text-center p-3 lg:p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-indigo-600 font-medium text-xs lg:text-sm mb-1">
                  Amount Due
                </p>
                <p className="text-3xl lg:text-4xl font-black text-indigo-900">
                  ₦{cartTotal.toFixed(2)}
                </p>
              </div>

              {saleError && (
                <div className="p-3 lg:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs lg:text-sm">
                  {saleError}
                </div>
              )}

              <div>
                <p className="text-xs lg:text-sm font-semibold text-slate-900 mb-2 lg:mb-3">
                  Select Method
                </p>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex flex-col items-center justify-center gap-1.5 lg:gap-2 p-2 lg:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="font-bold text-[10px] lg:text-sm">
                      Cash
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex flex-col items-center justify-center gap-1.5 lg:gap-2 p-2 lg:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="font-bold text-[10px] lg:text-sm">
                      Card POS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`flex flex-col items-center justify-center gap-1.5 lg:gap-2 p-2 lg:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Landmark className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="font-bold text-[10px] lg:text-sm">
                      Transfer
                    </span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="space-y-3 lg:space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs lg:text-sm font-semibold text-slate-900 block mb-1 lg:mb-2">
                      Amount Tendered
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base lg:text-lg">
                        ₦
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 lg:pl-10 pr-4 py-2 lg:py-3 rounded-xl border border-slate-200 text-lg lg:text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 lg:p-4 bg-slate-100 rounded-xl">
                    <span className="text-slate-600 font-medium text-sm lg:text-base">
                      Change Due
                    </span>
                    <span
                      className={`text-xl lg:text-2xl font-black ${
                        changeDue > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      ₦{changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 lg:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={
                  isProcessingSale ||
                  (paymentMethod === 'CASH' &&
                    (!amountTendered || Number(amountTendered) < cartTotal))
                }
                className="w-full bg-indigo-600 text-white font-bold text-base lg:text-lg py-3 lg:py-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isProcessingSale
                  ? 'Processing Sale...'
                  : 'Confirm & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 lg:p-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 lg:mb-6">
              <CheckCircle2 className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-600" />
            </div>

            <h2 className="text-xl lg:text-2xl font-black text-slate-900 mb-2">
              Sale Complete!
            </h2>
            <p className="text-sm lg:text-base text-slate-500 mb-6 lg:mb-8">
              Transaction has been recorded successfully.
            </p>

            <div className="w-full bg-slate-50 rounded-xl p-3 lg:p-4 mb-5 lg:mb-6">
              <div className="flex justify-between text-xs lg:text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-900">
                  ₦{completedSaleTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs lg:text-sm mt-2">
                <span className="text-slate-500">Payment</span>
                <span className="font-bold text-slate-900">
                  {paymentMethod}
                </span>
              </div>
            </div>

            <button
              onClick={resetTerminal}
              className="w-full bg-slate-900 text-white font-bold py-3 lg:py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all text-sm lg:text-base"
            >
              Start New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}