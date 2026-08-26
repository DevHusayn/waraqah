const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'apps', 'mobile', 'src');
const excludeDirs = ['theme'];
const excludeFiles = ['colors.js', 'ThemeProvider.js', 'useThemedStyles.js', 'index.js'];

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (excludeDirs.includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (/\.(jsx?)$/.test(entry.name) && !excludeFiles.includes(entry.name)) files.push(full);
    }
    return files;
}

function transform(content) {
    if (!content.includes('StyleSheet.create') || !content.includes('colors.')) {
        return content;
    }
    if (content.includes('useThemedStyles') || content.includes('createStyles(colors)')) {
        return content;
    }

    let next = content;

    if (!next.includes("from 'react'") && !next.includes('from "react"')) {
        next = `import { useMemo } from 'react';\n${next}`;
    } else if (!next.includes('useMemo')) {
        next = next.replace(
            /import\s+\{([^}]+)\}\s+from\s+['"]react['"];/,
            (match, imports) => {
                if (imports.includes('useMemo')) return match;
                return `import { ${imports.trim()}, useMemo } from 'react';`;
            },
        );
    }

    if (next.includes("from '../theme'") || next.includes('from "../theme"')) {
        next = next.replace(
            /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/theme['"];/g,
            (match, imports) => {
                if (imports.includes('useTheme')) return match;
                return `import { ${imports.trim()}, useTheme } from '../theme';`;
            },
        );
        next = next.replace(
            /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/theme['"];/g,
            (match, imports) => {
                if (imports.includes('useTheme')) return match;
                return `import { ${imports.trim()}, useTheme } from '../../theme';`;
            },
        );
    } else if (next.includes("from '../theme/colors'")) {
        next = next.replace(
            /import\s+\{\s*colors\s*\}\s+from\s+['"]\.\.\/theme\/colors['"];/,
            "import { useTheme } from '../theme';",
        );
        next = next.replace(
            /import\s+\{\s*colors\s*\}\s+from\s+['"]\.\.\/\.\.\/theme\/colors['"];/,
            "import { useTheme } from '../../theme';",
        );
    }

    next = next.replace(
        /const styles = StyleSheet\.create\(\{/,
        'function createStyles(colors) {\n    return StyleSheet.create({',
    );

    const styleBlockMatch = next.match(/function createStyles\(colors\) \{[\s\S]*?\n\}\);/);
    if (styleBlockMatch) {
        const block = styleBlockMatch[0];
        if (!block.endsWith('\n}')) {
            next = next.replace(block, `${block}\n}`);
        } else if (!block.includes('\n}\n') && block.endsWith('\n});')) {
            next = next.replace(block, block.replace(/\n\}\);$/, '\n    });\n}'));
        }
    }

    next = next.replace(/\n\}\);\n(?=\n*(export|function))/g, '\n    });\n}\n\n');

    const exportFn = next.match(/export function (\w+)/);
    if (exportFn) {
        const fnName = exportFn[1];
        const fnRegex = new RegExp(`(export function ${fnName}\\([^)]*\\)\\s*\\{)`);
        if (!next.includes('const { colors } = useTheme()')) {
            next = next.replace(
                fnRegex,
                `$1\n    const { colors } = useTheme();\n    const styles = useMemo(() => createStyles(colors), [colors]);`,
            );
        }
    }

    return next;
}

let changed = 0;
for (const file of walk(root)) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = transform(original);
    if (updated !== original) {
        fs.writeFileSync(file, updated);
        changed++;
    }
}

console.log(`Updated ${changed} mobile files`);
