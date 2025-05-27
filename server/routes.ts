import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, 
  insertOrderSchema, insertOrderItemSchema, insertProductReviewSchema, insertNotificationSchema,
  insertBrewerySettingsSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  addPushSubscription, 
  removePushSubscription, 
  sendPushNotificationToAll,
  sendPushNotificationToUser,
  sendPushNotificationByRole,
  getVapidPublicKey
} from './push-service';
import { upload, serveUploads } from './upload';
import path from 'path';

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  userId?: number;
  customerId?: number;
  role?: string;
  tableId?: number;
  isAuthenticated?: boolean;
}

const activeConnections = new Map<string, WebSocketClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Serve uploaded files
  app.use('/uploads', serveUploads);
  
  // Initialize session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'bierserv-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto', maxAge: 3600000 },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Authentication Routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, language: user.language });
      });
    })(req, res, next);
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/current', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = req.user as any;
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, language: user.language });
  });
  
  // Middleware to check authentication
  const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Middleware to check admin role
  const ensureAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };
  
  // Middleware to check manager or admin role
  const ensureManager = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && ((req.user as any).role === 'manager' || (req.user as any).role === 'admin')) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };

  // Upload Routes
  app.post('/api/upload/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada' });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
    }
  });

  app.post('/api/upload/multiple', ensureAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada' });
      }
      
      const imageUrls = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename
      }));
      
      res.json({ images: imageUrls });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao fazer upload das imagens' });
    }
  });
  
  // User Routes
  app.get('/api/users', ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get users' });
    }
  });
  
  app.post('/api/users', ensureAdmin, async (req, res) => {
    try {
      const validData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await storage.createUser(validData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  app.put('/api/users/:id', ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Only admin can edit other users
      if (userId !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const data = req.body;
      // Don't allow role change unless admin
      if (data.role && currentUser.role !== 'admin') {
        delete data.role;
      }
      
      const validData = insertUserSchema.partial().parse(data);
      const user = await storage.updateUser(userId, validData);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  // Brewery Settings Routes
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getBrewerySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get brewery settings' });
    }
  });
  
  app.put('/api/settings', ensureAdmin, async (req, res) => {
    try {
      const validData = insertBrewerySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBrewerySettings(validData);
      
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      // Broadcast settings update to all clients
      broadcastToAll({
        type: 'SETTINGS_UPDATED',
        data: settings
      });
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update brewery settings' });
    }
  });
  
  // Category Routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });
  
  app.get('/api/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get category' });
    }
  });
  
  app.post('/api/categories', ensureManager, async (req, res) => {
    try {
      const validData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validData);
      
      // Broadcast category update
      broadcastToAll({
        type: 'CATEGORY_CREATED',
        data: category
      });
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });
  
  app.put('/api/categories/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validData);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Broadcast category update
      broadcastToAll({
        type: 'CATEGORY_UPDATED',
        data: category
      });
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update category' });
    }
  });
  
  app.delete('/api/categories/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Broadcast category deletion
      broadcastToAll({
        type: 'CATEGORY_DELETED',
        data: { id }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });
  
  // Product Routes
  app.get('/api/products', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let products;
      if (categoryId) {
        products = await storage.getProductsByCategory(categoryId);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get products' });
    }
  });
  
  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get product' });
    }
  });
  
  app.post('/api/products', ensureManager, async (req, res) => {
    try {
      console.log('Dados recebidos para criar produto:', req.body);
      
      // Parse and validate the data
      const validData = insertProductSchema.parse(req.body);
      console.log('Dados validados:', validData);
      
      const product = await storage.createProduct(validData);
      console.log('Produto criado:', product);
      
      // Broadcast product creation
      broadcastToAll({
        type: 'PRODUCT_CREATED',
        data: product
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      if (error instanceof z.ZodError) {
        console.log('Erros de validação:', error.errors);
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create product' });
    }
  });
  
  app.put('/api/products/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validData);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Broadcast product update
      broadcastToAll({
        type: 'PRODUCT_UPDATED',
        data: product
      });
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update product' });
    }
  });
  
  app.delete('/api/products/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Broadcast product deletion
      broadcastToAll({
        type: 'PRODUCT_DELETED',
        data: { id }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });
  
  // Product Variations Routes
  app.get('/api/product-variations', async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      
      let variations;
      if (productId) {
        variations = await storage.getProductVariations(productId);
      } else {
        variations = await storage.getAllProductVariations();
      }
      
      res.json(variations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get product variations' });
    }
  });
  
  app.post('/api/product-variations', ensureManager, async (req, res) => {
    try {
      const validData = insertProductVariationSchema.parse(req.body);
      const variation = await storage.createProductVariation(validData);
      
      res.status(201).json(variation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create product variation' });
    }
  });
  
  app.put('/api/product-variations/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertProductVariationSchema.partial().parse(req.body);
      const variation = await storage.updateProductVariation(id, validData);
      
      if (!variation) {
        return res.status(404).json({ message: 'Product variation not found' });
      }
      
      res.json(variation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update product variation' });
    }
  });
  
  app.delete('/api/product-variations/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProductVariation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Product variation not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product variation' });
    }
  });
  
  // Table Routes
  app.get('/api/tables', async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get tables' });
    }
  });
  
  app.get('/api/tables/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const table = await storage.getTable(id);
      
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get table' });
    }
  });
  
  app.get('/api/tables/number/:number', async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      const table = await storage.getTableByNumber(number);
      
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get table' });
    }
  });
  
  app.post('/api/tables', ensureManager, async (req, res) => {
    try {
      const validData = insertTableSchema.parse(req.body);
      
      // Check if table number already exists
      const existingTable = await storage.getTableByNumber(validData.number);
      if (existingTable) {
        return res.status(400).json({ message: 'Table number already exists' });
      }
      
      const table = await storage.createTable(validData);
      
      // Broadcast table creation
      broadcastToAll({
        type: 'TABLE_CREATED',
        data: table
      });
      
      res.status(201).json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create table' });
    }
  });
  
  app.put('/api/tables/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertTableSchema.partial().parse(req.body);
      const table = await storage.updateTable(id, validData);
      
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      
      // Broadcast table update
      broadcastToAll({
        type: 'TABLE_UPDATED',
        data: table
      });
      
      res.json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update table' });
    }
  });
  
  app.delete('/api/tables/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTable(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Table not found' });
      }
      
      // Broadcast table deletion
      broadcastToAll({
        type: 'TABLE_DELETED',
        data: { id }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete table' });
    }
  });
  
  // Order Routes
  app.get('/api/orders', ensureAuthenticated, async (req, res) => {
    try {
      const tableId = req.query.tableId ? parseInt(req.query.tableId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let orders;
      if (tableId) {
        orders = await storage.getOrdersByTableId(tableId);
      } else if (limit) {
        orders = await storage.getRecentOrders(limit);
      } else {
        orders = await storage.getOrders();
      }
      
      // Fetch order items for each order with product details
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrderId(order.id);
          
          // Get product details for each item
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                name: product?.name || 'Produto',
                productName: product?.name || 'Produto'
              };
            })
          );
          
          return { ...order, items: itemsWithDetails };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get orders' });
    }
  });
  
  app.get('/api/orders/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Fetch order items with product details
      const items = await storage.getOrderItemsByOrderId(id);
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            name: product?.name || 'Produto',
            productName: product?.name || 'Produto'
          };
        })
      );
      
      res.json({ ...order, items: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get order' });
    }
  });
  
  app.post('/api/orders', async (req, res) => {
    try {
      const validData = insertOrderSchema.parse(req.body);
      
      // Get table to check if it exists
      const table = await storage.getTable(validData.tableId);
      if (!table) {
        return res.status(400).json({ message: 'Table not found' });
      }
      
      // Create order
      const order = await storage.createOrder(validData);
      
      // Create order items if provided
      let items = [];
      if (req.body.items && Array.isArray(req.body.items)) {
        items = await Promise.all(
          req.body.items.map(async (item: any) => {
            const validItem = insertOrderItemSchema.parse({
              ...item,
              orderId: order.id
            });
            return await storage.createOrderItem(validItem);
          })
        );
        
        // Update order total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await storage.updateOrder(order.id, { totalAmount });
      }
      
      // Update table status if it's not already occupied
      if (table.status !== 'occupied') {
        await storage.updateTable(table.id, {
          status: 'occupied',
          occupiedSince: new Date()
        });
        
        // Broadcast table update
        broadcastToAll({
          type: 'TABLE_UPDATED',
          data: { ...table, status: 'occupied', occupiedSince: new Date() }
        });
      }
      
      // Create notification for staff
      const notification = await storage.createNotification({
        message: `Novo pedido na Mesa ${table.number}`,
        type: 'order',
        read: false,
        userId: null, // Broadcast to all staff
      });
      
      // Broadcast new order notification
      broadcastToAll({
        type: 'NEW_ORDER',
        data: { ...order, items, table }
      });
      
      broadcastToAll({
        type: 'NEW_NOTIFICATION',
        data: notification
      });
      
      res.status(201).json({ ...order, items });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });
  
  app.put('/api/orders/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertOrderSchema.partial().parse(req.body);
      const oldOrder = await storage.getOrder(id);
      const order = await storage.updateOrder(id, validData);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Fetch order items and table info
      const items = await storage.getOrderItemsByOrderId(id);
      const table = await storage.getTable(order.tableId);
      
      // Broadcast order update with enhanced data
      broadcastToAll({
        type: 'ORDER_UPDATED',
        data: { 
          ...order, 
          items,
          table,
          previousStatus: oldOrder?.status,
          statusChanged: oldOrder?.status !== order.status
        }
      });

      // Special notification for waiters when order is ready for delivery
      if (validData.status === 'delivered' && oldOrder?.status !== 'delivered') {
        const notification = await storage.createNotification({
          message: `Mesa ${table?.number || order.tableId} - Pedido #${order.id} pronto para entrega`,
          type: 'order',
          read: false,
          userId: null, // Broadcast to all staff
        });
        
        // Create customer notification for order ready
        const customerNotification = await storage.createNotification({
          message: `Mesa ${table?.number || order.tableId} - Seu pedido foi entregue na mesa`,
          type: 'order',
          read: false,
          userId: null, // For customers
        });
        
        // Send notification ONLY to authenticated customers at this table
        broadcastToAuthenticatedCustomers({
          type: 'ORDER_STATUS_UPDATE',
          data: {
            orderId: order.id,
            tableId: order.tableId,
            tableNumber: table?.number || order.tableId,
            status: 'delivered',
            message: `Mesa ${table?.number || order.tableId} - Seu pedido foi entregue na mesa`,
            notification: customerNotification,
            timestamp: new Date()
          }
        }, order.tableId);

        // Broadcast special delivery notification to all waiters
        broadcastToRole({
          type: 'DELIVERY_READY',
          data: { 
            orderId: order.id,
            tableNumber: table?.number || order.tableId,
            message: `Pedido #${order.id} pronto para entrega - Mesa ${table?.number || order.tableId}`
          }
        }, 'waiter');

        // Also broadcast to admins and managers
        broadcastToRole({
          type: 'DELIVERY_READY',
          data: { 
            orderId: order.id,
            tableNumber: table?.number || order.tableId,
            message: `Pedido #${order.id} pronto para entrega - Mesa ${table?.number || order.tableId}`
          }
        }, 'admin');

        broadcastToRole({
          type: 'DELIVERY_READY',
          data: { 
            orderId: order.id,
            tableNumber: table?.number || order.tableId,
            message: `Pedido #${order.id} pronto para entrega - Mesa ${table?.number || order.tableId}`
          }
        }, 'manager');
      }
      
      // Create notification if status changed to completed
      if (validData.status === 'completed') {
        const table = await storage.getTable(order.tableId);
        if (table) {
          // Check if there are no more active orders for this table
          const activeOrders = (await storage.getOrdersByTableId(table.id))
            .filter(o => o.id !== order.id && o.status !== 'completed' && o.status !== 'cancelled');
          
          if (activeOrders.length === 0) {
            // Free up the table
            await storage.updateTable(table.id, {
              status: 'free',
              occupiedSince: null
            });
            
            // Broadcast table update
            broadcastToAll({
              type: 'TABLE_UPDATED',
              data: { ...table, status: 'free', occupiedSince: null }
            });
          }
        }
      }
      
      res.json({ ...order, items });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update order' });
    }
  });
  
  app.delete('/api/orders/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Delete all order items first
      const items = await storage.getOrderItemsByOrderId(id);
      for (const item of items) {
        await storage.deleteOrderItem(item.id);
      }
      
      // Delete the order
      const success = await storage.deleteOrder(id);
      
      // Broadcast order deletion
      broadcastToAll({
        type: 'ORDER_DELETED',
        data: { id }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete order' });
    }
  });
  
  // Order Item Routes
  app.post('/api/order-items', async (req, res) => {
    try {
      const validData = insertOrderItemSchema.parse(req.body);
      
      // Verify order exists
      const order = await storage.getOrder(validData.orderId);
      if (!order) {
        return res.status(400).json({ message: 'Order not found' });
      }
      
      // Verify product exists
      const product = await storage.getProduct(validData.productId);
      if (!product) {
        return res.status(400).json({ message: 'Product not found' });
      }
      
      const orderItem = await storage.createOrderItem(validData);
      
      // Update order total amount
      const items = await storage.getOrderItemsByOrderId(order.id);
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await storage.updateOrder(order.id, { totalAmount });
      
      // Broadcast order item creation
      broadcastToAll({
        type: 'ORDER_ITEM_CREATED',
        data: { ...orderItem, order: { ...order, totalAmount } }
      });
      
      res.status(201).json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order item' });
    }
  });
  
  app.put('/api/order-items/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertOrderItemSchema.partial().parse(req.body);
      const orderItem = await storage.updateOrderItem(id, validData);
      
      if (!orderItem) {
        return res.status(404).json({ message: 'Order item not found' });
      }
      
      // Update order total amount if quantity changed
      if (validData.quantity) {
        const order = await storage.getOrder(orderItem.orderId);
        if (order) {
          const items = await storage.getOrderItemsByOrderId(order.id);
          const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          await storage.updateOrder(order.id, { totalAmount });
          
          // Broadcast order update
          broadcastToAll({
            type: 'ORDER_UPDATED',
            data: { ...order, totalAmount, items }
          });
        }
      }
      
      // Broadcast order item update
      broadcastToAll({
        type: 'ORDER_ITEM_UPDATED',
        data: orderItem
      });
      
      res.json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update order item' });
    }
  });
  
  app.delete('/api/order-items/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderItem = await storage.getOrderItem(id);
      
      if (!orderItem) {
        return res.status(404).json({ message: 'Order item not found' });
      }
      
      const success = await storage.deleteOrderItem(id);
      
      // Update order total amount
      const order = await storage.getOrder(orderItem.orderId);
      if (order) {
        const items = await storage.getOrderItemsByOrderId(order.id);
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await storage.updateOrder(order.id, { totalAmount });
        
        // Broadcast order update
        broadcastToAll({
          type: 'ORDER_UPDATED',
          data: { ...order, totalAmount, items }
        });
      }
      
      // Broadcast order item deletion
      broadcastToAll({
        type: 'ORDER_ITEM_DELETED',
        data: { id, orderId: orderItem.orderId }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete order item' });
    }
  });
  
  // Product Review Routes
  app.get('/api/product-reviews', async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const approvedOnly = req.query.approved === 'true';
      
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
      
      let reviews;
      if (approvedOnly) {
        reviews = await storage.getApprovedProductReviewsByProductId(productId);
      } else {
        reviews = await storage.getProductReviewsByProductId(productId);
      }
      
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get product reviews' });
    }
  });
  
  app.post('/api/product-reviews', async (req, res) => {
    try {
      const validData = insertProductReviewSchema.parse(req.body);
      
      // Verify product exists
      const product = await storage.getProduct(validData.productId);
      if (!product) {
        return res.status(400).json({ message: 'Product not found' });
      }
      
      const review = await storage.createProductReview(validData);
      
      // Create notification for staff about new review
      const notification = await storage.createNotification({
        message: `Nova avaliação para ${product.name}`,
        type: 'order',
        read: false,
        userId: null, // Broadcast to all staff
      });
      
      // Broadcast new review notification
      broadcastToAll({
        type: 'NEW_PRODUCT_REVIEW',
        data: review
      });
      
      broadcastToAll({
        type: 'NEW_NOTIFICATION',
        data: notification
      });
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create product review' });
    }
  });
  
  app.put('/api/product-reviews/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertProductReviewSchema.partial().parse(req.body);
      const review = await storage.updateProductReview(id, validData);
      
      if (!review) {
        return res.status(404).json({ message: 'Product review not found' });
      }
      
      // Broadcast review update
      broadcastToAll({
        type: 'PRODUCT_REVIEW_UPDATED',
        data: review
      });
      
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update product review' });
    }
  });
  
  app.delete('/api/product-reviews/:id', ensureManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProductReview(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Product review not found' });
      }
      
      // Broadcast review deletion
      broadcastToAll({
        type: 'PRODUCT_REVIEW_DELETED',
        data: { id }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product review' });
    }
  });
  
  // Notification Routes
  app.get('/api/notifications', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const unreadOnly = req.query.unread === 'true';
      
      let notifications;
      if (unreadOnly) {
        notifications = await storage.getUnreadNotificationsByUserId(user.id);
      } else {
        notifications = await storage.getNotificationsByUserId(user.id);
      }
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });
  
  app.post('/api/notifications', ensureAuthenticated, async (req, res) => {
    try {
      const validData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validData);
      
      // Broadcast notification
      broadcastToAll({
        type: 'NEW_NOTIFICATION',
        data: notification
      });
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });
  
  app.put('/api/notifications/:id/read', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Accept waiter call
  app.post('/api/waiter-calls/:tableId/accept', async (req, res) => {
    try {
      const { tableId } = req.params;
      const table = await storage.getTable(parseInt(tableId));
      
      if (!table) {
        return res.status(404).json({ message: 'Mesa não encontrada' });
      }

      // Broadcast that the call was accepted
      broadcastToAll({
        type: 'WAITER_CALL_ACCEPTED',
        data: {
          tableId: table.id,
          tableNumber: table.number,
          message: `Chamado da Mesa ${table.number} foi atendido`
        }
      });

      res.json({ 
        success: true, 
        message: `Chamado da Mesa ${table.number} aceito com sucesso`,
        tableId: table.id,
        tableNumber: table.number
      });
    } catch (error) {
      console.error('Error accepting waiter call:', error);
      res.status(500).json({ message: 'Erro ao aceitar chamado' });
    }
  });
  
  // Rotas para notificações push em dispositivos móveis
  app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });
  
  app.post('/api/push-subscription', ensureAuthenticated, async (req, res) => {
    try {
      const { subscription, userId, role } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: 'Inscrição inválida' });
      }
      
      // Adicionar a nova inscrição
      const success = await addPushSubscription(
        subscription, 
        userId ? parseInt(userId) : (req.user as any)?.id, 
        role || (req.user as any)?.role
      );
      
      if (success) {
        return res.status(201).json({ message: 'Inscrição de notificações push registrada com sucesso' });
      } else {
        return res.status(500).json({ message: 'Erro ao registrar inscrição' });
      }
    } catch (error) {
      console.error('Erro ao processar inscrição push:', error);
      res.status(500).json({ message: 'Erro interno ao processar inscrição' });
    }
  });
  
  app.delete('/api/push-subscription', ensureAuthenticated, async (req, res) => {
    try {
      const { subscription } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: 'Inscrição inválida' });
      }
      
      // Remover a inscrição
      const success = await removePushSubscription(subscription);
      
      if (success) {
        return res.json({ message: 'Inscrição removida com sucesso' });
      } else {
        return res.status(500).json({ message: 'Erro ao remover inscrição' });
      }
    } catch (error) {
      console.error('Erro ao remover inscrição push:', error);
      res.status(500).json({ message: 'Erro interno ao remover inscrição' });
    }
  });
  
  // Endpoint para enviar notificações push de teste (apenas para administradores)
  app.post('/api/push/send-test', ensureAdmin, async (req, res) => {
    try {
      const { title, body, target, userId, role } = req.body;
      
      let result;
      if (target === 'all') {
        result = await sendPushNotificationToAll({ title, body });
      } else if (target === 'user' && userId) {
        result = await sendPushNotificationToUser(parseInt(userId), { title, body });
      } else if (target === 'role' && role) {
        result = await sendPushNotificationByRole(role, { title, body });
      } else {
        return res.status(400).json({ message: 'Parâmetros inválidos' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao enviar notificação push de teste:', error);
      res.status(500).json({ message: 'Erro ao enviar notificação push' });
    }
  });

  // Setup WebSockets
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection established');
    ws.isAlive = true;
    
    const clientId = Date.now().toString();
    activeConnections.set(clientId, ws);
    
    // Send welcome message to confirm connection
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Successfully connected to brewery server'
    }));
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('message', (message) => {
      try {
        console.log('WebSocket message received:', message.toString());
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'AUTH') {
          console.log(`User authenticated on WebSocket: ${data.userId}, role: ${data.role}`);
          ws.userId = data.userId;
          ws.role = data.role;
          ws.isAuthenticated = true;
          
          // Confirm authentication
          ws.send(JSON.stringify({
            type: 'AUTH_CONFIRMED',
            userId: data.userId,
            role: data.role
          }));
        }
        
        // Handle customer authentication (for QR code menu)
        if (data.type === 'CUSTOMER_AUTH') {
          console.log(`Customer authenticated on WebSocket: ${data.customerId}, table: ${data.tableId}`);
          ws.customerId = data.customerId;
          ws.role = 'customer';
          ws.tableId = data.tableId;
          ws.isAuthenticated = true;
          
          // Confirm customer authentication
          ws.send(JSON.stringify({
            type: 'CUSTOMER_AUTH_CONFIRMED',
            customerId: data.customerId,
            tableId: data.tableId
          }));
        }
        
        // Handle table association
        if (data.type === 'JOIN_TABLE') {
          console.log(`Client joined table: ${data.tableId}`);
          ws.tableId = data.tableId;
          
          // Confirm table join
          ws.send(JSON.stringify({
            type: 'TABLE_JOINED',
            tableId: data.tableId
          }));
        }
        
        // Handle waiter call
        if (data.type === 'CALL_WAITER') {
          const tableId = data.tableId || ws.tableId;
          if (tableId) {
            console.log(`Waiter called for table: ${tableId}`);
            handleWaiterCall(tableId);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: ${code}, ${reason}`);
      activeConnections.delete(clientId);
    });
  });
  
  // Ping all clients every 30 seconds to keep connections alive
  const pingInterval = setInterval(() => {
    activeConnections.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Helper function to broadcast to all clients
  function broadcastToAll(data: any) {
    const message = JSON.stringify(data);
    console.log(`Broadcasting to all clients: ${message}`);
    
    let sentCount = 0;
    activeConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });
    
    console.log(`Broadcast completed to ${sentCount} clients`);
  }
  
  // Helper function to broadcast to specific role
  function broadcastToRole(data: any, role: string) {
    const message = JSON.stringify(data);
    console.log(`Broadcasting to role ${role}: ${message}`);
    
    let sentCount = 0;
    activeConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.role === role) {
        client.send(message);
        sentCount++;
      }
    });
    
    console.log(`Broadcast to role ${role} completed to ${sentCount} clients`);
  }
  
  // Helper function to broadcast to specific table
  function broadcastToTable(data: any, tableId: number) {
    const message = JSON.stringify(data);
    console.log(`Broadcasting to table ${tableId}: ${message}`);
    
    let sentCount = 0;
    activeConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.tableId === tableId) {
        client.send(message);
        sentCount++;
      }
    });
    
    console.log(`Broadcast to table ${tableId} completed to ${sentCount} clients`);
  }

  // Helper function to broadcast to authenticated customers only (for status notifications)
  function broadcastToAuthenticatedCustomers(data: any, tableId?: number) {
    const message = JSON.stringify(data);
    console.log(`Broadcasting to authenticated customers only: ${message}`);
    
    let sentCount = 0;
    activeConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && 
          client.isAuthenticated && 
          client.customerId &&
          (!tableId || client.tableId === tableId)) {
        client.send(message);
        sentCount++;
      }
    });
    
    console.log(`Broadcast to authenticated customers completed to ${sentCount} clients`);
  }
  
  // Helper function to handle waiter calls
  async function handleWaiterCall(tableId: number) {
    try {
      const table = await storage.getTable(tableId);
      if (!table) return;
      
      // Create notification for staff
      const notification = await storage.createNotification({
        message: `Mesa ${table.number} - Garçom chamado`,
        type: 'waiter_request',
        read: false,
        userId: null, // Broadcast to all staff
      });
      
      // Broadcast notification to staff
      broadcastToAll({
        type: 'WAITER_CALLED',
        data: { tableId, tableNumber: table.number }
      });
      
      broadcastToAll({
        type: 'NEW_NOTIFICATION',
        data: notification
      });
      
      // Enviar notificação push para dispositivos móveis
      try {
        // Enviar para garçons
        await sendPushNotificationByRole('waiter', {
          title: '🔔 Garçom Chamado!',
          body: `Mesa ${table.number} está solicitando atendimento`,
          tag: `waiter-call-${table.id}`,
          data: {
            tableId: table.id,
            tableNumber: table.number,
            type: 'waiter_call'
          },
          requireInteraction: true,
          renotify: true
        });
        
        // Enviar para gerentes
        await sendPushNotificationByRole('manager', {
          title: '🔔 Chamado de Mesa',
          body: `Mesa ${table.number} está chamando o garçom`,
          tag: `waiter-call-${table.id}`,
          data: {
            tableId: table.id,
            tableNumber: table.number,
            type: 'waiter_call'
          },
          requireInteraction: true,
          renotify: true
        });
        
        console.log(`Notificações push enviadas para a Mesa ${table.number}`);
      } catch (pushError) {
        console.error('Erro ao enviar notificações push:', pushError);
        // Não interrompe o fluxo em caso de erro nas notificações push
      }
    } catch (error) {
      console.error('Error handling waiter call:', error);
    }
  }
  
  // Customer Authentication Routes (for QR code menu access)
  app.post('/api/auth/customer-register', async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
      }
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      
      // Create customer
      const customer = await storage.createCustomer({
        name,
        email,
        phone: phone || null,
        password, // In production, this should be hashed
        isActive: true
      });
      
      res.status(201).json({ 
        id: customer.id,
        name: customer.name,
        email: customer.email,
        message: 'Cadastro realizado com sucesso!'
      });
    } catch (error) {
      console.error('Customer registration error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.post('/api/auth/customer-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      // Find customer
      const customer = await storage.getCustomerByEmail(email);
      if (!customer || customer.password !== password || !customer.isActive) {
        return res.status(401).json({ message: 'Email ou senha incorretos' });
      }
      
      // Store customer session
      (req.session as any).customerId = customer.id;
      (req.session as any).customerRole = 'customer';
      
      res.json({ 
        id: customer.id,
        name: customer.name,
        email: customer.email,
        message: 'Login realizado com sucesso!'
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.post('/api/auth/customer-logout', async (req, res) => {
    try {
      (req.session as any).customerId = undefined;
      (req.session as any).customerRole = undefined;
      res.json({ message: 'Logout realizado com sucesso!' });
    } catch (error) {
      res.status(500).json({ message: 'Erro no logout' });
    }
  });
  
  app.get('/api/auth/customer-current', async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(401).json({ message: 'Cliente não encontrado' });
      }
      
      res.json({
        id: customer.id,
        name: customer.name,
        email: customer.email
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  return httpServer;
}
