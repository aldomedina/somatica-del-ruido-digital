import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

/**
 * Script para extraer todos los paths relativos de imagenes
 * desde public/images y guardarlos en src/data/imagePaths.ts
 */

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

/**
 * Escanea recursivamente un directorio y retorna todos los archivos de imagen
 */
function scanDirectory(dir: string, baseDir: string): string[] {
  const results: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Ignorar archivos ocultos y .DS_Store
    if (entry.name.startsWith(".")) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursivamente escanear subdirectorios
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      // Verificar si es una imagen
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        // Convertir a path relativo desde public/
        const relativePath = path.relative(baseDir, fullPath);
        // Convertir a formato web (forward slashes)
        const webPath = "/" + relativePath.replace(/\\/g, "/");
        results.push(webPath);
      }
    }
  }

  return results;
}

/**
 * Genera el contenido del archivo TypeScript
 */
function generateFileContent(imagePaths: string[]): string {
  const header = `/**
 * Auto-generated file with all image paths from public/images
 * Generated on: ${new Date().toISOString()}
 * Total images: ${imagePaths.length}
 */

export const imagePaths: string[] = [
`;

  const paths = imagePaths.map((p) => `  "${p}",`).join("\n");

  const footer = `
];

export default imagePaths;
`;

  return header + paths + footer;
}

/**
 * Main execution
 */
function main() {
  const rootDir = path.resolve(__dirname, "..");
  const publicDir = path.join(rootDir, "public");
  const imagesDir = path.join(publicDir, "images");
  const outputFile = path.join(rootDir, "src", "data", "imagePaths.ts");

  console.log("[SCAN] Scanning images directory:", imagesDir);

  // Verificar que existe el directorio
  if (!fs.existsSync(imagesDir)) {
    console.error("[ERROR] Directory does not exist:", imagesDir);
    process.exit(1);
  }

  // Escanear todas las imagenes
  const imagePaths = scanDirectory(imagesDir, publicDir);

  console.log(`[OK] Found ${imagePaths.length} images`);

  // Crear directorio data si no existe
  const dataDir = path.dirname(outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Generar y escribir archivo
  const fileContent = generateFileContent(imagePaths);
  fs.writeFileSync(outputFile, fileContent, "utf-8");

  console.log(`[OK] Generated file:`, outputFile);
  console.log(`[STATS] Total images: ${imagePaths.length}`);

  // Estadisticas por carpeta
  const folderStats: Record<string, number> = {};
  imagePaths.forEach((p) => {
    const parts = p.split("/");
    if (parts.length > 2) {
      const folder = parts[2]; // /images/folder/...
      folderStats[folder] = (folderStats[folder] || 0) + 1;
    }
  });

  console.log("\n[STATS] Images per folder:");
  Object.entries(folderStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([folder, count]) => {
      console.log(`   ${folder}: ${count}`);
    });
}

main();
