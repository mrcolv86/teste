import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "manager", "waiter"] }).notNull().default("waiter"),
  language: text("language", { enum: ["pt", "en", "es"] }).notNull().default("pt"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Customer model (for QR code menu access)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Brewery settings model
export const brewerySettings = pgTable("brewery_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slogan: text("slogan"), // Slogan da cervejaria
  description: text("description"), // Descrição da cervejaria
  logo: text("logo"), // URL do logo
  favicon: text("favicon"), // URL do favicon
  headerLogo: text("header_logo"), // Logo específico para cabeçalho
  menuLogo: text("menu_logo"), // Logo específico para menu QR
  primaryColor: text("primary_color").default("#D97706"),
  secondaryColor: text("secondary_color").default("#047857"),
  accentColor: text("accent_color").default("#F59E0B"), // Cor de destaque
  backgroundColor: text("background_color").default("#FFFFFF"), // Cor de fundo
  textColor: text("text_color").default("#1F2937"), // Cor do texto
  defaultLanguage: text("default_language", { enum: ["pt", "en", "es"] }).notNull().default("pt"),
  // Informações de contato
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  socialMedia: jsonb("social_media"), // Instagram, Facebook, etc.
  // Configurações de aparência
  fontFamily: text("font_family").default("Inter"), // Família da fonte
  borderRadius: text("border_radius").default("medium"), // small, medium, large
  buttonStyle: text("button_style").default("rounded"), // rounded, square, pill
  // Meta informações para SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  // Configurações do menu QR
  qrMenuTitle: text("qr_menu_title"), // Título personalizado para menu QR
  qrMenuSubtitle: text("qr_menu_subtitle"), // Subtítulo para menu QR
  qrWelcomeMessage: text("qr_welcome_message"), // Mensagem de boas-vindas
  // Configurações de tema
  darkMode: boolean("dark_mode").default(false),
  customCss: text("custom_css"), // CSS customizado
});

export const insertBrewerySettingsSchema = createInsertSchema(brewerySettings).omit({ id: true });
export type InsertBrewerySettings = z.infer<typeof insertBrewerySettingsSchema>;
export type BrewerySettings = typeof brewerySettings.$inferSelect;

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  translations: jsonb("translations"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  image: text("image"),
  categoryId: integer("category_id").notNull(),
  ibu: integer("ibu"),
  abv: doublePrecision("abv"),
  pairings: jsonb("pairings"),
  isActive: boolean("is_active").notNull().default(true),
  translations: jsonb("translations"),
  ratings: jsonb("ratings").default("[]"),
  // Novos campos adicionais
  volume: integer("volume"), // em ml
  weight: integer("weight"), // em gramas
  servingSize: text("serving_size"), // pequeno, médio, grande, etc
  additionalInfo: jsonb("additional_info"), // informações extras
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product Variations model (for different sizes, volumes, etc.)
export const productVariations = pgTable("product_variations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(), // Ex: "350ml", "500ml", "1L", "Individual", "Família"
  priceAdjustment: doublePrecision("price_adjustment").notNull().default(0), // Ajuste no preço base
  description: text("description"), // Ex: "Tamanho individual", "Perfeito para compartilhar"
  isActive: boolean("is_active").notNull().default(true),
});

export const insertProductVariationSchema = createInsertSchema(productVariations).omit({ id: true });
export type InsertProductVariation = z.infer<typeof insertProductVariationSchema>;
export type ProductVariation = typeof productVariations.$inferSelect;

// Table model
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  qrCode: text("qr_code"),
  status: text("status", { enum: ["free", "occupied", "reserved"] }).notNull().default("free"),
  occupiedSince: timestamp("occupied_since"),
  reservationTime: timestamp("reservation_time"),
});

export const insertTableSchema = createInsertSchema(tables).omit({ id: true });
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tables.$inferSelect;

// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull(),
  status: text("status", { enum: ["new", "preparing", "delivered", "completed", "cancelled"] }).notNull().default("new"),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Item model
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productVariationId: integer("product_variation_id"), // Variação escolhida (opcional)
  quantity: integer("quantity").notNull().default(1),
  price: doublePrecision("price").notNull(),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Product Review model
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({ id: true, createdAt: true });
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  message: text("message").notNull(),
  type: text("type", { enum: ["order", "waiter_request", "promotion"] }).notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Pairing Suggestions model - para armazenar harmonizações já usadas
export const pairingSuggestions = pgTable("pairing_suggestions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPairingSuggestionSchema = createInsertSchema(pairingSuggestions).omit({ id: true, createdAt: true });
export type InsertPairingSuggestion = z.infer<typeof insertPairingSuggestionSchema>;
export type PairingSuggestion = typeof pairingSuggestions.$inferSelect;
