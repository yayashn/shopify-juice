const fs = require("fs-extra");
const path = require("path");

const components = {};

async function loadAllComponents(srcDir) {
    const files = await fs.readdir(srcDir);
    for (const file of files) {
        const filePath = path.join(srcDir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            await loadAllComponents(filePath);
        } else if (path.extname(filePath) === ".liquid") {
            const content = await fs.readFile(filePath, "utf8");
            if (content.includes("<!--component-->")) {
                const componentName = path.parse(filePath).name;
                const componentContent = content.split("<!--component-->")[1];
                components[componentName] = componentContent.trim();
            }
        }
    }
}

function replaceComponents(content) {
    let replacedContent = content;
    let previousContent;

    do {
        previousContent = replacedContent;
        replacedContent = replaceSingleLevelComponents(replacedContent);
    } while (replacedContent !== previousContent);

    return replacedContent;
}

function replaceSingleLevelComponents(content) {
    Object.keys(components).forEach(componentName => {
        const tagOpen = `<${componentName}`;
        const tagClose = `</${componentName}>`;
        const regexSelfClosing = new RegExp(`${tagOpen}([^>]*?)/>`, 'g'); // Match self-closing tags
        const regexWithChildren = new RegExp(`${tagOpen}([^>]*?)>([\\s\\S]*?)${tagClose}`, 'g'); // Match tags with children

        // Handle self-closing tags (no children)
        content = content.replace(regexSelfClosing, (match, propsString) => {
            return replacePropsInComponent(componentName, propsString, "");
        });

        // Handle tags with children
        content = content.replace(regexWithChildren, (match, propsString, innerContent) => {
            return replacePropsInComponent(componentName, propsString, innerContent);
        });
    });

    return content;
}

function replacePropsInComponent(componentName, propsString, innerContent) {
    let componentContent = components[componentName];

    // Replace props placeholders
    const props = [...propsString.matchAll(/(\w+)\s*=\s*["']([^"']+)["']/g)];
    props.forEach(([_, key, value]) => {
        const propPlaceholder = `<<${key}>>`;
        const regexProp = new RegExp(propPlaceholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g');
        componentContent = componentContent.replace(regexProp, value);
    });

    // Replace the <<children>> placeholder with the inner content
    componentContent = componentContent.replace(/<<children>>/g, innerContent.trim());

    // Cleanup any leftover placeholders
    componentContent = componentContent.replace(/<<\w+>>/g, '');

    return componentContent;
}


  
module.exports = {
    loadAllComponents,
    replaceComponents,
};
