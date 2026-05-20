/**
 * Script para diagnosticar problemas de contraseña
 * Uso: npx ts-node -O '{"module":"commonjs"}' scripts/debug-auth.ts <email>
 */

import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("❌ Por favor proporciona un email");
    console.log("Uso: npx ts-node scripts/debug-auth.ts <email>");
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Diagnóstico de autenticación para: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) {
      console.log("❌ Usuario no encontrado en la base de datos");
      process.exit(1);
    }

    console.log("✅ Usuario encontrado:");
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Rol: ${user.role}`);
    console.log(`   - Activo: ${user.isActive}`);
    console.log(`   - Hash guardado: ${user.passwordHash.substring(0, 20)}...`);

    if (!user.isActive) {
      console.log("\n⚠️  PROBLEMA: El usuario está inactivo (isActive = false)");
      console.log("   Solución: Activa el usuario en la base de datos\n");
    }

    // Probar si el hash es válido
    if (!user.passwordHash || user.passwordHash.length < 20) {
      console.log("\n⚠️  PROBLEMA: El hash de contraseña no parece válido");
      console.log("   Solución: Cambia la contraseña usando el script change-password.ts\n");
    }

    // Probar con contraseña de prueba
    const testPassword = "test123";
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);

    if (isValid) {
      console.log(`\n⚠️  AVISO: La contraseña parece ser "${testPassword}"`);
      console.log("   (El usuario podría haber usado esta contraseña de prueba)\n");
    }

    console.log("📝 Pasos a seguir:");
    console.log("1. Ejecuta: npx ts-node scripts/change-password.ts");
    console.log("2. Ingresa tu email");
    console.log("3. Ingresa una nueva contraseña (mín. 6 caracteres)");
    console.log("4. Intenta iniciar sesión nuevamente\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
