import { users, type User, type InsertUser, customers, type Customer, type InsertCustomer,
  categories, type Category, type InsertCategory, 
  products, type Product, type InsertProduct, tables, type Table, type InsertTable,
  orders, type Order, type InsertOrder, orderItems, type OrderItem, type InsertOrderItem,
  productReviews, type ProductReview, type InsertProductReview, notifications, type Notification, 
  type InsertNotification, brewerySettings, type BrewerySettings, type InsertBrewerySettings } from "@shared/schema";
import { z } from 'zod';

// Interface for the storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Customer operations (for QR code menu access)
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  
  // Brewery settings operations
  getBrewerySettings(): Promise<BrewerySettings | undefined>;
  updateBrewerySettings(data: Partial<InsertBrewerySettings>): Promise<BrewerySettings | undefined>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Product Variation operations
  getProductVariations(productId: number): Promise<ProductVariation[]>;
  getAllProductVariations(): Promise<ProductVariation[]>;
  createProductVariation(variation: InsertProductVariation): Promise<ProductVariation>;
  updateProductVariation(id: number, data: Partial<InsertProductVariation>): Promise<ProductVariation | undefined>;
  deleteProductVariation(id: number): Promise<boolean>;
  
  // Table operations
  getTable(id: number): Promise<Table | undefined>;
  getTableByNumber(number: number): Promise<Table | undefined>;
  getTables(): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByTableId(tableId: number): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Order Item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // Product Review operations
  getProductReview(id: number): Promise<ProductReview | undefined>;
  getProductReviewsByProductId(productId: number): Promise<ProductReview[]>;
  getApprovedProductReviewsByProductId(productId: number): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: number, data: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: number): Promise<boolean>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Pairing Suggestions operations
  getPairingSuggestions(): Promise<PairingSuggestion[]>;
  createOrUpdatePairingSuggestion(name: string): Promise<PairingSuggestion>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private tables: Map<number, Table>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private productReviews: Map<number, ProductReview>;
  private notifications: Map<number, Notification>;
  private brewerySettings: BrewerySettings | undefined;
  
  private userId: number;
  private categoryId: number;
  private productId: number;
  private tableId: number;
  private orderId: number;
  private orderItemId: number;
  private productReviewId: number;
  private notificationId: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.tables = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.productReviews = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.productId = 1;
    this.tableId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.productReviewId = 1;
    this.notificationId = 1;
    
    // Initialize with default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@admin.com",
      name: "Administrator",
      role: "admin",
      language: "pt"
    });
    
    // Initialize default brewery settings
    this.brewerySettings = {
      id: 1,
      name: "BierServ",
      logo: "",
      primaryColor: "#D97706",
      secondaryColor: "#047857",
      defaultLanguage: "pt"
    };
    
    // Setup initial categories
    this.setupInitialData();
  }
  
  private setupInitialData() {
    // Default categories
    const beersCategory = this.createCategory({
      name: "Cervejas",
      icon: "beer-mug-empty",
      displayOrder: 1,
      isActive: true,
      translations: { en: "Beers", es: "Cervezas" }
    });
    
    const snacksCategory = this.createCategory({
      name: "Petiscos",
      icon: "utensils",
      displayOrder: 2,
      isActive: true,
      translations: { en: "Snacks", es: "Aperitivos" }
    });
    
    const mealsCategory = this.createCategory({
      name: "Pratos",
      icon: "plate-wheat",
      displayOrder: 3,
      isActive: true,
      translations: { en: "Meals", es: "Platos" }
    });
    
    // Default products
    this.createProduct({
      name: "IPA Tropical",
      description: "Uma IPA aromática com notas de frutas tropicais e lúpulo cítrico.",
      price: 28.00,
      image: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d",
      categoryId: beersCategory.id,
      ibu: 65,
      abv: 6.8,
      pairings: ["Hambúrguer", "Queijos"],
      isActive: true,
      translations: {
        en: {
          name: "Tropical IPA",
          description: "An aromatic IPA with notes of tropical fruits and citrus hops."
        },
        es: {
          name: "IPA Tropical",
          description: "Una IPA aromática con notas de frutas tropicales y lúpulo cítrico."
        }
      },
      ratings: []
    });
    
    this.createProduct({
      name: "Stout Café",
      description: "Stout encorpada com notas intensas de café, chocolate e leve amargor no final.",
      price: 32.00,
      image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148",
      categoryId: beersCategory.id,
      ibu: 38,
      abv: 7.2,
      pairings: ["Costela", "Sobremesas"],
      isActive: true,
      translations: {
        en: {
          name: "Coffee Stout",
          description: "Full-bodied stout with intense notes of coffee, chocolate and slight bitterness at the end."
        },
        es: {
          name: "Stout de Café",
          description: "Stout corpulento con intensas notas de café, chocolate y ligero amargor al final."
        }
      },
      ratings: []
    });
    
    this.createProduct({
      name: "Pilsen Clássica",
      description: "Cerveja leve e refrescante, com equilíbrio entre malte e lúpulo. Final seco e cristalino.",
      price: 24.00,
      image: "https://images.unsplash.com/photo-1608270586620-248524c67de9",
      categoryId: beersCategory.id,
      ibu: 25,
      abv: 4.8,
      pairings: ["Frutos do mar", "Saladas"],
      isActive: true,
      translations: {
        en: {
          name: "Classic Pilsner",
          description: "Light and refreshing beer, with a balance between malt and hops. Dry and crystal-clear finish."
        },
        es: {
          name: "Pilsen Clásica",
          description: "Cerveza ligera y refrescante, con equilibrio entre malta y lúpulo. Final seco y cristalino."
        }
      },
      ratings: []
    });
    
    // Create sample tables
    for (let i = 1; i <= 12; i++) {
      const status = i % 3 === 0 ? "occupied" : (i % 4 === 0 ? "reserved" : "free");
      const occupiedSince = status === "occupied" ? new Date() : undefined;
      const reservationTime = status === "reserved" ? new Date(Date.now() + 3600000) : undefined;
      
      this.createTable({
        number: i,
        qrCode: `https://bierserv.com/menu/table/${i}`,
        status,
        occupiedSince,
        reservationTime
      });
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Brewery settings operations
  async getBrewerySettings(): Promise<BrewerySettings | undefined> {
    return this.brewerySettings;
  }
  
  async updateBrewerySettings(data: Partial<InsertBrewerySettings>): Promise<BrewerySettings | undefined> {
    if (!this.brewerySettings) return undefined;
    
    this.brewerySettings = { ...this.brewerySettings, ...data };
    return this.brewerySettings;
  }
  
  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...data };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.categoryId === categoryId);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...data };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Table operations
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }
  
  async getTableByNumber(number: number): Promise<Table | undefined> {
    return Array.from(this.tables.values())
      .find(table => table.number === number);
  }
  
  async getTables(): Promise<Table[]> {
    return Array.from(this.tables.values())
      .sort((a, b) => a.number - b.number);
  }
  
  async createTable(table: InsertTable): Promise<Table> {
    const id = this.tableId++;
    const newTable: Table = { ...table, id };
    this.tables.set(id, newTable);
    return newTable;
  }
  
  async updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined> {
    const table = this.tables.get(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...data };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }
  
  async deleteTable(id: number): Promise<boolean> {
    return this.tables.delete(id);
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getOrdersByTableId(tableId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.tableId === tableId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      ...data,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }
  
  // Order Item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }
  
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }
  
  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;
    
    const updatedOrderItem = { ...orderItem, ...data };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }
  
  // Product Review operations
  async getProductReview(id: number): Promise<ProductReview | undefined> {
    return this.productReviews.get(id);
  }
  
  async getProductReviewsByProductId(productId: number): Promise<ProductReview[]> {
    return Array.from(this.productReviews.values())
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getApprovedProductReviewsByProductId(productId: number): Promise<ProductReview[]> {
    return Array.from(this.productReviews.values())
      .filter(review => review.productId === productId && review.approved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const id = this.productReviewId++;
    const newReview: ProductReview = {
      ...review,
      id,
      createdAt: new Date()
    };
    this.productReviews.set(id, newReview);
    return newReview;
  }
  
  async updateProductReview(id: number, data: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const review = this.productReviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...data };
    this.productReviews.set(id, updatedReview);
    return updatedReview;
  }
  
  async deleteProductReview(id: number): Promise<boolean> {
    return this.productReviews.delete(id);
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...data };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

import { DatabaseStorage } from './storage-db';

// Uncomment the line below and comment out the MemStorage line to switch to database storage
export const storage = new DatabaseStorage();
// export const storage = new MemStorage();
