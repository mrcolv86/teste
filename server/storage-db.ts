import { db } from './db';
import { 
  users, 
  customers,
  brewerySettings, 
  categories, 
  products, 
  productVariations,
  tables, 
  orders, 
  orderItems, 
  productReviews, 
  notifications, 
  type User, 
  type InsertUser, 
  type Customer,
  type InsertCustomer,
  type BrewerySettings, 
  type InsertBrewerySettings,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductVariation,
  type InsertProductVariation,
  type Table,
  type InsertTable,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ProductReview,
  type InsertProductReview,
  type Notification,
  type InsertNotification
} from '@shared/schema';
import { IStorage } from './storage';
import { eq, desc, and, lte } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  // Brewery settings operations
  async getBrewerySettings(): Promise<BrewerySettings | undefined> {
    const [settings] = await db.select().from(brewerySettings);
    return settings;
  }

  async updateBrewerySettings(data: Partial<InsertBrewerySettings>): Promise<BrewerySettings | undefined> {
    const existingSettings = await this.getBrewerySettings();
    
    if (existingSettings) {
      const [updatedSettings] = await db.update(brewerySettings)
        .set(data)
        .where(eq(brewerySettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      const [newSettings] = await db.insert(brewerySettings)
        .values(data as InsertBrewerySettings)
        .returning();
      return newSettings;
    }
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }

  // Product Variation operations
  async getProductVariations(productId: number): Promise<ProductVariation[]> {
    return await db.select()
      .from(productVariations)
      .where(eq(productVariations.productId, productId))
      .orderBy(productVariations.name);
  }

  async getAllProductVariations(): Promise<ProductVariation[]> {
    return await db.select()
      .from(productVariations)
      .orderBy(productVariations.productId, productVariations.name);
  }

  async createProductVariation(variation: InsertProductVariation): Promise<ProductVariation> {
    const [newVariation] = await db.insert(productVariations)
      .values(variation)
      .returning();
    return newVariation;
  }

  async updateProductVariation(id: number, data: Partial<InsertProductVariation>): Promise<ProductVariation | undefined> {
    const [updatedVariation] = await db.update(productVariations)
      .set(data)
      .where(eq(productVariations.id, id))
      .returning();
    return updatedVariation;
  }

  async deleteProductVariation(id: number): Promise<boolean> {
    const result = await db.delete(productVariations).where(eq(productVariations.id, id));
    return !!result;
  }

  // Table operations
  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.number, number));
    return table;
  }

  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(tables.number);
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined> {
    const [updatedTable] = await db.update(tables)
      .set(data)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db.delete(tables).where(eq(tables.id, id));
    return !!result;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByTableId(tableId: number): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .where(eq(orders.tableId, tableId))
      .orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders)
      .values({
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return !!result;
  }

  // Order Item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item;
  }

  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(orderItem).returning();
    return newItem;
  }

  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedItem] = await db.update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return !!result;
  }

  // Product Review operations
  async getProductReview(id: number): Promise<ProductReview | undefined> {
    const [review] = await db.select().from(productReviews).where(eq(productReviews.id, id));
    return review;
  }

  async getProductReviewsByProductId(productId: number): Promise<ProductReview[]> {
    return await db.select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async getApprovedProductReviewsByProductId(productId: number): Promise<ProductReview[]> {
    return await db.select()
      .from(productReviews)
      .where(and(
        eq(productReviews.productId, productId),
        eq(productReviews.approved, true)
      ))
      .orderBy(desc(productReviews.createdAt));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db.insert(productReviews)
      .values({
        ...review,
        createdAt: new Date()
      })
      .returning();
    return newReview;
  }

  async updateProductReview(id: number, data: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updatedReview] = await db.update(productReviews)
      .set(data)
      .where(eq(productReviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const result = await db.delete(productReviews).where(eq(productReviews.id, id));
    return !!result;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications)
      .values({
        ...notification,
        createdAt: new Date()
      })
      .returning();
    return newNotification;
  }

  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(notifications)
      .set(data)
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return !!result;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Pairing Suggestions operations
  async getPairingSuggestions(): Promise<PairingSuggestion[]> {
    return await db.select()
      .from(pairingSuggestions)
      .orderBy(desc(pairingSuggestions.usageCount));
  }

  async createOrUpdatePairingSuggestion(name: string): Promise<PairingSuggestion> {
    // Check if suggestion already exists
    const [existing] = await db.select()
      .from(pairingSuggestions)
      .where(eq(pairingSuggestions.name, name));

    if (existing) {
      // Update usage count
      const [updated] = await db.update(pairingSuggestions)
        .set({ usageCount: existing.usageCount + 1 })
        .where(eq(pairingSuggestions.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new suggestion
      const [newSuggestion] = await db.insert(pairingSuggestions)
        .values({ name, usageCount: 1 })
        .returning();
      return newSuggestion;
    }
  }
}