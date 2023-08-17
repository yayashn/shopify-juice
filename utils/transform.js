/**
 * Transforms JSX-like syntax into Liquid syntax.
 * @param {string} content - The content to transform.
 * @param {Object} componentMap - The map of components.
 * @returns {string} - The transformed content.
 */
function transformJSXtoLiquid(content, componentMap) {
    let transformed = false;

    const jsxPatternWithProps = /<([A-Z][a-zA-Z0-9]*)\s?(.*?)>([\s\S]*?)<\/\1>/g;
    content = content.replace(jsxPatternWithProps, (match, componentName, props, childrenContent) => {
        if (componentMap[componentName]) {
            transformed = true;
            let componentContent = componentMap[componentName].replace('<slot/>', childrenContent.trim());

            const propPattern = /(\w+)={(\d+|'[^']*'|"[^"]*")}/g;
            let propMatch;
            while ((propMatch = propPattern.exec(props)) !== null) {
                const propName = propMatch[1];
                const propValue = propMatch[2].replace(/['"]/g, ''); // Remove quotes
                const propPlaceholder = new RegExp(`{${propName}}`, 'g');
                componentContent = componentContent.replace(propPlaceholder, propValue);
            }

            componentContent = componentContent.replace(/{\w+}/g, '');

            return componentContent;
        }
        return match;
    });

    const selfClosingPatternWithProps = /<([A-Z][a-zA-Z0-9]*)\s?(.*?)(\/>|>)/g;
    content = content.replace(selfClosingPatternWithProps, (match, componentName, props) => {
        if (componentMap[componentName]) {
            transformed = true;
            let componentContent = componentMap[componentName];

            const propPattern = /(\w+)={(\d+|'[^']*'|"[^"]*")}/g;
            let propMatch;
            while ((propMatch = propPattern.exec(props)) !== null) {
                const propName = propMatch[1];
                const propValue = propMatch[2].replace(/['"]/g, ''); // Remove quotes
                const propPlaceholder = new RegExp(`{${propName}}`, 'g');
                componentContent = componentContent.replace(propPlaceholder, propValue);
            }

            componentContent = componentContent.replace(/{\w+}/g, '');

            return componentContent;
        }
        return match;
    });

    if (transformed) {
        return transformJSXtoLiquid(content, componentMap);
    }

    return content;
}

module.exports = {
    transformJSXtoLiquid
};
