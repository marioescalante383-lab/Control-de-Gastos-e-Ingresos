import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos iniciales (Seed)...');

  // 1. Categorías Base del Sistema para Gastos
  const expenseCategories = [
    { name: 'Alimentos', color: '#10b981', icon: 'Utensils', type: 'EXPENSE' },
    { name: 'Bebidas', color: '#06b6d4', icon: 'Coffee', type: 'EXPENSE' },
    { name: 'Limpieza', color: '#3b82f6', icon: 'Sparkles', type: 'EXPENSE' },
    { name: 'Higiene personal', color: '#8b5cf6', icon: 'Smile', type: 'EXPENSE' },
    { name: 'Salud', color: '#ef4444', icon: 'HeartPulse', type: 'EXPENSE' },
    { name: 'Ropa', color: '#ec4899', icon: 'Shirt', type: 'EXPENSE' },
    { name: 'Electrónica', color: '#6366f1', icon: 'Laptop', type: 'EXPENSE' },
    { name: 'Herramientas', color: '#f59e0b', icon: 'Wrench', type: 'EXPENSE' },
    { name: 'Transporte', color: '#64748b', icon: 'Car', type: 'EXPENSE' },
    { name: 'Entretenimiento', color: '#d946ef', icon: 'Film', type: 'EXPENSE' },
    { name: 'Servicios', color: '#14b8a6', icon: 'Zap', type: 'EXPENSE' },
    { name: 'Hogar', color: '#84cc16', icon: 'Home', type: 'EXPENSE' },
    { name: 'Mascotas', color: '#f97316', icon: 'PawPrint', type: 'EXPENSE' },
    { name: 'Otros', color: '#94a3b8', icon: 'MoreHorizontal', type: 'EXPENSE' },
  ];

  // 2. Categorías Base del Sistema para Ingresos
  const incomeCategories = [
    { name: 'Sueldo', color: '#22c55e', icon: 'Briefcase', type: 'INCOME' },
    { name: 'Negocio', color: '#10b981', icon: 'Store', type: 'INCOME' },
    { name: 'Venta', color: '#3b82f6', icon: 'ShoppingBag', type: 'INCOME' },
    { name: 'Freelance', color: '#8b5cf6', icon: 'Code', type: 'INCOME' },
    { name: 'Inversiones', color: '#f59e0b', icon: 'TrendingUp', type: 'INCOME' },
    { name: 'Intereses', color: '#06b6d4', icon: 'Percent', type: 'INCOME' },
    { name: 'Otros Ingresos', color: '#64748b', icon: 'Wallet', type: 'INCOME' },
  ];

  for (const cat of [...expenseCategories, ...incomeCategories]) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, isSystem: true },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          type: cat.type,
          isSystem: true,
          isActive: true,
        },
      });
    }
  }

  // 3. Usuario demo para pruebas inmediatas
  const demoEmail = 'demo@antigravity.finance';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Demo1234!', salt);

    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        fullName: 'Usuario Demo',
        currency: 'MXN',
      },
    });

    console.log(`Usuario demo creado exitosamente: ${user.email} (Password: Demo1234!)`);
  }

  console.log('Seed completado satisfactoriamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
