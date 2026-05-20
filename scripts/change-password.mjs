// Script simple en JavaScript para cambiar contraseña
// Uso: node scripts/change-password.mjs

import prisma from '../lib/prisma.ts';
import bcrypt from 'bcryptjs';

const email = 'admin@floreria.com';
const newPassword = 'Password123'; // Cambia esto por tu contraseña deseada

async function changePassword() {
  try {
    console.log(`🔍 Buscando usuario: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rol: ${user.role}`);
    console.log(`   - Activo: ${user.isActive}`);

    console.log(`\n🔐 Hasheando nueva contraseña...`);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log(`\n💾 Actualizando contraseña en base de datos...`);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log('✅ ¡Contraseña actualizada exitosamente!');
    console.log(`\n📝 Credenciales de acceso:`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log(`\n🎉 Ya puedes iniciar sesión`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changePassword();
