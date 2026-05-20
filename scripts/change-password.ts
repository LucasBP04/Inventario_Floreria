/**
 * Script para cambiar contraseña en la base de datos
 * Uso: npx ts-node -O '{"module":"commonjs"}' scripts/change-password.ts
 */

import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log("🔐 Cambiar contraseña de usuario\n");

    const email = await question("📧 Ingresa tu email: ");
    const newPassword = await question("🔑 Ingresa la nueva contraseña: ");
    const confirmPassword = await question("✅ Confirma la contraseña: ");

    if (newPassword !== confirmPassword) {
      console.error("❌ Las contraseñas no coinciden");
      rl.close();
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error("❌ La contraseña debe tener al menos 6 caracteres");
      rl.close();
      process.exit(1);
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error("❌ Usuario no encontrado");
      rl.close();
      process.exit(1);
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log("✅ Contraseña actualizada exitosamente");
    console.log(`📧 Email: ${email}`);
    console.log("🔐 Ya puedes iniciar sesión con la nueva contraseña");

    rl.close();
  } catch (error) {
    console.error("❌ Error:", error);
    rl.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
