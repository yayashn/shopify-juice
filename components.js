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
            const componentRegex = /<!--\s*component\s*-->/; // Regular expression to match both formats
            if (componentRegex.test(content)) {
                const componentName = path.parse(filePath).name;
                const componentContent = content.split(componentRegex)[1]; // Split using the regex
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
    let updatedContent = content;
    
    for (const componentName of Object.keys(components)) {
        const tagOpen = `<${componentName}`;
        const tagClose = `</${componentName}>`;
        const regexSelfClosing = new RegExp(`${tagOpen}([^>]*?)/>`, 'g');
        const regexWithChildren = new RegExp(`${tagOpen}([^>]*?)>([\\s\\S]*?)${tagClose}`, 'g');

        updatedContent = updatedContent.replace(regexSelfClosing, (match, propsString) => 
            replacePropsInComponent(componentName, propsString, "")
        );

        updatedContent = updatedContent.replace(regexWithChildren, (match, propsString, innerContent) => 
            replacePropsInComponent(componentName, propsString, innerContent)
        );
    }

    return updatedContent;
}

function replacePropsInComponent(componentName, propsString, innerContent) {
    let componentContent = components[componentName];
    
    // Replace props placeholders
    const props = [...propsString.matchAll(/(\w+)\s*=\s*["']([^"']+)["']/g)];
    for (const [_, key, value] of props) {
        const propPlaceholder = `<<${key}>>`;
        const regexProp = new RegExp(propPlaceholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g');
        componentContent = componentContent.replace(regexProp, value);
    }

    // Replace children
    componentContent = componentContent.replace(/<<children>>/g, innerContent.trim());
    
    // Cleanup leftover placeholders
    componentContent = componentContent.replace(/<<\w+>>/g, '');

    return componentContent;
}

module.exports = {
    loadAllComponents,
    replaceComponents,
};