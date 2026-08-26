const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'apps', 'mobile', 'src');

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (/\.js$/.test(entry.name)) files.push(full);
    }
    return files;
}

function fixImports(content) {
    if (!content.includes('useTheme()') || content.includes('useTheme }') || content.includes('useTheme,')) {
        return content;
    }

    const themeImport = content.match(/import\s+\{([^}]+)\}\s+from\s+['"](\.\.\/)+theme['"];/);
    if (themeImport) {
        return content.replace(themeImport[0], (line) => {
            if (line.includes('useTheme')) return line;
            return line.replace(/\}\s+from/, ', useTheme } from');
        });
    }

    const colorsOnlyImport = content.match(/import\s+\{\s*colors\s*\}\s+from\s+['"](\.\.\/)+theme\/colors['"];/);
    if (colorsOnlyImport) {
        return content.replace(colorsOnlyImport[0], colorsOnlyImport[0].replace(/colors\s*\}\s+from\s+['"](\.\.\/)+theme\/colors['"]/, "useTheme } from '$1theme'").replace("'../theme'", match => match));
    }

    return content;
}

let changed = 0;
for (const file of walk(root)) {
    const original = fs.readFileSync(file, 'utf8');
    let content = fixImports(original);

    if (content.includes('useTheme()') && !content.match(/import[\s\S]*useTheme/)) {
        const depth = file.includes('screens/settings') ? '../../' : file.includes('screens') || file.includes('navigation') || file.includes('components/ui') ? '../' : '../';
        if (!content.includes("from '../theme'") && !content.includes("from '../../theme'")) {
            content = `import { useTheme } from '${file.includes('settings') ? '../../' : '../'}theme';\n${content}`;
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
    }
}

console.log(`Fixed imports in ${changed} files`);
