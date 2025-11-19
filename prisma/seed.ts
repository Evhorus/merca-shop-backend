import slug from 'slug';
import { Category, Prisma, PrismaClient, Product } from '../generated/prisma';

const prisma = new PrismaClient();

// Definimos nombres para categorías madres e hijas
const parentCategoriesData = [
  'Electrónica',
  'Ropa',
  'Hogar',
  'Juguetes',
  'Deportes',
  'Libros',
  'Belleza',
  'Alimentos',
  'Herramientas',
  'Automotriz',
];

const childCategoriesData = [
  ['Teléfonos', 'Computadoras'],
  ['Hombres', 'Mujeres'],
  ['Cocina', 'Decoración'],
  ['Peluches', 'Juegos de mesa'],
  ['Fútbol', 'Natación'],
  ['Ficción', 'No Ficción'],
  ['Cuidado de la piel', 'Maquillaje'],
  ['Snacks', 'Bebidas'],
  ['Eléctricas', 'Manuales'],
  ['Accesorios', 'Repuestos'],
];

const possibleFeatures = [
  {
    name: 'Material',
    values: ['Plástico', 'Metal', 'Madera', 'Vidrio', 'Tela', 'Cuero'],
  },
  {
    name: 'Garantía',
    values: ['6 meses', '1 año', '2 años', '3 años', 'Sin garantía'],
  },
  {
    name: 'Color',
    values: ['Rojo', 'Azul', 'Negro', 'Blanco', 'Verde', 'Amarillo', 'Gris'],
  },
  { name: 'Peso', values: ['100g', '250g', '500g', '1kg', '2kg', '5kg'] },
  {
    name: 'Dimensiones',
    values: ['10x10x10 cm', '20x15x10 cm', '30x20x15 cm', '50x40x30 cm'],
  },
  {
    name: 'Marca',
    values: [
      'GenericBrand',
      'TopQuality',
      'PremiumLine',
      'EcoFriendly',
      'SmartTech',
    ],
  },
  {
    name: 'País de origen',
    values: ['China', 'USA', 'Colombia', 'México', 'Alemania', 'Japón'],
  },
  {
    name: 'Certificación',
    values: ['ISO 9001', 'CE', 'FDA', 'Ninguna', 'Eco-Label'],
  },
  { name: 'Resistencia', values: ['Baja', 'Media', 'Alta', 'Muy alta'] },
  {
    name: 'Uso recomendado',
    values: ['Interior', 'Exterior', 'Ambos', 'Profesional', 'Doméstico'],
  },
  { name: 'Velocidad', values: ['Lenta', 'Media', 'Rápida', 'Muy rápida'] },
  {
    name: 'Capacidad',
    values: ['Pequeña', 'Mediana', 'Grande', 'Extra grande'],
  },
  {
    name: 'Nivel de ruido',
    values: ['Silencioso', 'Bajo', 'Moderado', 'Alto'],
  },
  { name: 'Consumo energético', values: ['A+++', 'A++', 'A+', 'A', 'B', 'C'] },
  {
    name: 'Tipo de acabado',
    values: ['Mate', 'Brillante', 'Satinado', 'Texturizado'],
  },
];

async function main() {
  // Borrar datos existentes para resetear la base
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Crear categorías madres y sus hijas
  const allChildCategories: Category[] = [];

  for (let i = 0; i < parentCategoriesData.length; i++) {
    const parentName = parentCategoriesData[i];
    const parentSlug = parentName.toLowerCase().replace(/\s+/g, '-');
    const parentCategory = await prisma.category.create({
      data: {
        name: parentName,
        slug: parentSlug,
        description: `Categoría principal de ${parentName.toLowerCase()}`,
        isActive: true,
      },
    });

    const childrenForParent = childCategoriesData[i];
    for (const childName of childrenForParent) {
      const childCategory = await prisma.category.create({
        data: {
          name: childName,
          slug: slug(childName),
          description: `Categoría hija de ${parentName.toLowerCase()}`,
          isActive: true,
          parentId: parentCategory.id,
        },
      });
      allChildCategories.push(childCategory);
    }
  }

  const totalProducts = 1000;

  const productsPerCategory = Math.max(
    Math.floor(totalProducts / allChildCategories.length),
    1,
  );

  const productsData: Prisma.ProductCreateManyInput[] = [];

  let productCount = 1;

  const createdProducts: Product[] = [];

  // Crear productos uno a uno para capturar sus IDs
  for (const category of allChildCategories) {
    for (let i = 0; i < productsPerCategory; i++) {
      const product = await prisma.product.create({
        data: {
          name: `Producto ${productCount}`,
          slug: `producto-${productCount}`,
          sku: `sku-producto-${productCount}`,
          price: new Prisma.Decimal(
            Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000,
          ),
          description: `Descripción del producto ${productCount}`,
          categoryId: category.id,
          isActive: true,
          stock: 100,
          brand: null,
          colorId: null,
        },
      });
      createdProducts.push(product);
      productCount++;
    }
  }
  await prisma.product.createMany({ data: productsData });

  const featuresData: Prisma.ProductFeatureCreateManyInput[] = [];

  for (const product of createdProducts) {
    // Generar número aleatorio de características entre 5 y 10
    const numFeatures = Math.floor(Math.random() * 6) + 5; // 5 a 10

    // Mezclar array de características para tomar aleatorias
    const shuffledFeatures = [...possibleFeatures].sort(
      () => Math.random() - 0.5,
    );

    // Tomar las primeras numFeatures características
    const selectedFeatures = shuffledFeatures.slice(0, numFeatures);

    for (const feature of selectedFeatures) {
      // Seleccionar un valor aleatorio para esta característica
      const randomValue =
        feature.values[Math.floor(Math.random() * feature.values.length)];

      featuresData.push({
        name: feature.name,
        value: randomValue,
        productId: product.id,
      });
    }
  }

  await prisma.productFeature.createMany({ data: featuresData });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
