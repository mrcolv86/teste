import { db } from './db';
import { 
  users, 
  brewerySettings, 
  categories, 
  products, 
  tables,
  type InsertUser,
  type InsertBrewerySettings,
  type InsertCategory,
  type InsertProduct,
  type InsertTable
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// Função para verificar se já existem dados no banco
async function checkIfDataExists() {
  const [user] = await db.select().from(users);
  return !!user;
}

// Função para criar usuário admin
async function createAdminUser() {
  const adminUser: InsertUser = {
    username: 'admin',
    password: 'admin123', // Este é apenas para desenvolvimento
    email: 'admin@bierserv.com',
    name: 'Administrador',
    role: 'admin',
    language: 'pt'
  };

  console.log('Criando usuário admin...');
  await db.insert(users).values(adminUser).onConflictDoNothing();
}

// Função para criar configurações da cervejaria
async function createBrewerySettings() {
  const settings: InsertBrewerySettings = {
    name: 'BierServ',
    logo: null,
    primaryColor: '#F59E0B',
    secondaryColor: '#78350F',
    defaultLanguage: 'pt'
  };

  console.log('Criando configurações da cervejaria...');
  await db.insert(brewerySettings).values(settings).onConflictDoNothing();
}

// Função para criar categorias
async function createCategories() {
  const categoriesData: InsertCategory[] = [
    {
      name: 'Cervejas',
      icon: 'beer',
      displayOrder: 1,
      isActive: true,
      translations: {
        en: {
          name: 'Beers'
        },
        es: {
          name: 'Cervezas'
        }
      }
    },
    {
      name: 'Petiscos',
      icon: 'utensils',
      displayOrder: 2,
      isActive: true,
      translations: {
        en: {
          name: 'Snacks'
        },
        es: {
          name: 'Aperitivos'
        }
      }
    },
    {
      name: 'Pratos Principais',
      icon: 'dish',
      displayOrder: 3,
      isActive: true,
      translations: {
        en: {
          name: 'Main Dishes'
        },
        es: {
          name: 'Platos Principales'
        }
      }
    },
    {
      name: 'Bebidas',
      icon: 'glass',
      displayOrder: 4,
      isActive: true,
      translations: {
        en: {
          name: 'Drinks'
        },
        es: {
          name: 'Bebidas'
        }
      }
    }
  ];

  console.log('Criando categorias...');
  for (const category of categoriesData) {
    await db.insert(categories).values(category).onConflictDoNothing();
  }
}

// Função para criar produtos
async function createProducts() {
  // Primeiro, busca as categorias
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map();
  allCategories.forEach(cat => categoryMap.set(cat.name, cat.id));

  const productsData: InsertProduct[] = [
    {
      name: 'IPA',
      price: 18.90,
      categoryId: categoryMap.get('Cervejas'),
      description: 'Cerveja estilo India Pale Ale, com notas cítricas e amargor pronunciado.',
      image: '/assets/ipa.jpg',
      isActive: true,
      ibu: 55,
      abv: 6.2,
      pairings: ['carnes grelhadas', 'queijos fortes', 'curry'],
      ratings: null,
      translations: {
        en: {
          name: 'IPA',
          description: 'India Pale Ale style beer, with citrus notes and pronounced bitterness.'
        },
        es: {
          name: 'IPA',
          description: 'Cerveza estilo India Pale Ale, con notas cítricas y amargura pronunciada.'
        }
      }
    },
    {
      name: 'Pilsen',
      price: 14.90,
      categoryId: categoryMap.get('Cervejas'),
      description: 'Cerveja leve e refrescante, perfeita para o dia a dia.',
      image: '/assets/pilsen.jpg',
      isActive: true,
      ibu: 22,
      abv: 4.8,
      pairings: ['frutos do mar', 'saladas', 'pratos leves'],
      ratings: null,
      translations: {
        en: {
          name: 'Pilsner',
          description: 'Light and refreshing beer, perfect for everyday drinking.'
        },
        es: {
          name: 'Pilsen',
          description: 'Cerveza ligera y refrescante, perfecta para el día a día.'
        }
      }
    },
    {
      name: 'Stout',
      price: 19.90,
      categoryId: categoryMap.get('Cervejas'),
      description: 'Cerveja escura e encorpada, com notas de café e chocolate.',
      image: '/assets/stout.jpg',
      isActive: true,
      ibu: 35,
      abv: 5.5,
      pairings: ['sobremesas de chocolate', 'carnes assadas', 'queijos azuis'],
      ratings: null,
      translations: {
        en: {
          name: 'Stout',
          description: 'Dark and full-bodied beer, with notes of coffee and chocolate.'
        },
        es: {
          name: 'Stout',
          description: 'Cerveza oscura y corpulenta, con notas de café y chocolate.'
        }
      }
    },
    {
      name: 'Tábua de Frios',
      price: 49.90,
      categoryId: categoryMap.get('Petiscos'),
      description: 'Seleção de queijos e embutidos, servidos com pães artesanais.',
      image: '/assets/tabua-frios.jpg',
      isActive: true,
      ibu: null,
      abv: null,
      pairings: null,
      ratings: null,
      translations: {
        en: {
          name: 'Charcuterie Board',
          description: 'Selection of cheeses and charcuterie, served with artisanal bread.'
        },
        es: {
          name: 'Tabla de Embutidos',
          description: 'Selección de quesos y embutidos, servidos con panes artesanales.'
        }
      }
    },
    {
      name: 'Batata Frita',
      price: 24.90,
      categoryId: categoryMap.get('Petiscos'),
      description: 'Batatas fritas crocantes, servidas com molho especial da casa.',
      image: '/assets/batata-frita.jpg',
      isActive: true,
      ibu: null,
      abv: null,
      pairings: null,
      ratings: null,
      translations: {
        en: {
          name: 'French Fries',
          description: 'Crispy french fries, served with special house sauce.'
        },
        es: {
          name: 'Papas Fritas',
          description: 'Papas fritas crujientes, servidas con salsa especial de la casa.'
        }
      }
    }
  ];

  console.log('Criando produtos...');
  for (const product of productsData) {
    await db.insert(products).values(product).onConflictDoNothing();
  }
}

// Função para criar mesas
async function createTables() {
  const tablesData: InsertTable[] = [
    {
      number: 1,
      status: 'free',
      qrCode: null,
      occupiedSince: null,
      reservationTime: null
    },
    {
      number: 2,
      status: 'free',
      qrCode: null,
      occupiedSince: null,
      reservationTime: null
    },
    {
      number: 3,
      status: 'free',
      qrCode: null,
      occupiedSince: null,
      reservationTime: null
    },
    {
      number: 4,
      status: 'free',
      qrCode: null,
      occupiedSince: null,
      reservationTime: null
    },
    {
      number: 5,
      status: 'free',
      qrCode: null,
      occupiedSince: null,
      reservationTime: null
    }
  ];

  console.log('Criando mesas...');
  for (const table of tablesData) {
    await db.insert(tables).values(table).onConflictDoNothing();
  }
}

// Função principal para executar o seed
export async function seed() {
  try {
    const hasData = await checkIfDataExists();

    if (!hasData) {
      console.log('Iniciando seed do banco de dados...');
      
      await createAdminUser();
      await createBrewerySettings();
      await createCategories();
      await createProducts();
      await createTables();
      
      console.log('Seed concluído com sucesso!');
    } else {
      console.log('O banco de dados já possui dados. Pulando seed.');
    }
  } catch (error) {
    console.error('Erro ao executar seed:', error);
  }
}

// Chama o seed diretamente quando o arquivo é executado
seed();