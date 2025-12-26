import fs from 'fs';
import path from 'path';

// This script adds 'await' to all db.* method calls in API route files

const API_DIR = path.join(process.cwd(), 'app', 'api');

function processFile(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Pattern to match db method calls that don't already have await
    // Matches: "const x = db.method(" or "db.method(" but not "await db.method("
    const pattern = /(\s+)(const\s+\w+\s+=\s+)(db\.\w+\()/g;
    const pattern2 = /(\s+)(db\.\w+\()/g;

    let modified = content;
    let changed = false;

    // Add await to assignments: const x = db.method() -> const x = await db.method()
    modified = modified.replace(pattern, (match, whitespace, assignment, dbCall) => {
        if (!match.includes('await')) {
            changed = true;
            return `${whitespace}${assignment}await ${dbCall}`;
        }
        return match;
    });

    // Add await to standalone calls: db.method() -> await db.method()
    modified = modified.replace(pattern2, (match, whitespace, dbCall) => {
        // Skip if it's part of an assignment (already handled above)
        if (match.includes('const ') || match.includes('let ') || match.includes('var ')) {
            return match;
        }
        // Skip if already has await
        if (match.includes('await')) {
            return match;
        }
        changed = true;
        return `${whitespace}await ${dbCall}`;
    });

    if (changed) {
        fs.writeFileSync(filePath, modified, 'utf-8');
        console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
        return true;
    }

    return false;
}

function walkDirectory(dir: string): number {
    let filesUpdated = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            filesUpdated += walkDirectory(fullPath);
        } else if (entry.isFile() && entry.name === 'route.ts') {
            if (processFile(fullPath)) {
                filesUpdated++;
            }
        }
    }

    return filesUpdated;
}

console.log('🔄 Adding await keywords to database calls in API routes...\n');
const updated = walkDirectory(API_DIR);
console.log(`\n✅ Updated ${updated} route files`);
