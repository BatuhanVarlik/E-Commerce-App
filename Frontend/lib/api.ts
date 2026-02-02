import axios from "axios";
import { cookieStorage } from "./cookieStorage";

// API base URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5162";
export const API_URL = API_BASE_URL;

// Type definitions
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  brandId: string;
}

interface CategoryData {
  name: string;
  parentId?: string;
}

interface BrandData {
  name: string;
}

interface ProductFilterParams {
  searchQuery?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

// Axios instance oluştur
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = cookieStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Token expire olursa logout yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz veya expire olmuş
      cookieStorage.clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Kullanım örnekleri:
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/Auth/login", { email, password }),

  register: (data: RegisterData) => api.post("/api/Auth/register", data),

  googleLogin: (idToken: string) => api.post("/api/Auth/google", { idToken }),

  forgotPassword: (email: string) =>
    api.post("/api/Auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/api/Auth/reset-password", { token, newPassword }),
};

export const productsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get("/api/Products", { params }),

  getFiltered: (params?: ProductFilterParams) =>
    api.get("/api/Products/filter", { params }),

  getById: (id: string) => api.get(`/api/Products/${id}`),

  create: (data: ProductData) => api.post("/api/admin/products", data),

  update: (id: string, data: Partial<ProductData>) =>
    api.put(`/api/admin/products/${id}`, data),

  delete: (id: string) => api.delete(`/api/admin/products/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get("/api/Categories"),

  create: (data: CategoryData) => api.post("/api/admin/categories", data),

  update: (id: string, data: Partial<CategoryData>) =>
    api.put(`/api/admin/categories/${id}`, data),

  delete: (id: string) => api.delete(`/api/admin/categories/${id}`),
};

export const brandsApi = {
  getAll: () => api.get("/api/Brands"),

  create: (data: BrandData) => api.post("/api/Brands", data),
};

export const ordersApi = {
  getMyOrders: () => api.get("/api/Orders/my-orders"),

  getAllOrders: () => api.get("/api/admin/orders"),

  updateStatus: (id: string, status: string) =>
    api.put(`/api/admin/orders/${id}/status`, { status }),
};

export const couponApi = {
  validate: (code: string, cartTotal: number) =>
    api.post("/api/Coupon/validate", { code, cartTotal }),

  apply: (code: string, cartTotal: number) =>
    api.post("/api/Coupon/apply", { code, cartTotal }),

  getActive: () => api.get("/api/Coupon/active"),

  getHistory: () => api.get("/api/Coupon/history"),

  // Admin endpoints
  create: (data: {
    code: string;
    type: number;
    value: number;
    minimumAmount: number;
    maxUsage: number;
    startDate: string;
    expiryDate: string;
    categoryId?: string;
    productId?: string;
  }) => api.post("/api/Coupon", data),

  getAll: () => api.get("/api/Coupon"),

  getById: (id: string) => api.get(`/api/Coupon/${id}`),

  update: (
    id: string,
    data: Partial<{
      type: number;
      value: number;
      minimumAmount: number;
      maxUsage: number;
      startDate: string;
      expiryDate: string;
      isActive: boolean;
      categoryId?: string;
      productId?: string;
    }>,
  ) => api.put(`/api/Coupon/${id}`, data),

  delete: (id: string) => api.delete(`/api/Coupon/${id}`),
};

export default api;
