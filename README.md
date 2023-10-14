# Shopify Juice

Shopify Juice is a build tool designed to enhance the development experience for Shopify themes. It introduces a component system for `.liquid` files, allowing for a more modular and organized approach to theme development.

## Setup

1. Place your Shopify theme inside a folder named `src`.
2. In your project root, run the tool using:

```
npx shopify-juice@latest
```

## Pseudo-Subfolders
You can create any level of subfolders in the `src` directory. Shopify doesn't actually allow subfolders but with this system you can replace forward slashes in your path with underscores to refer to subdirectories. For example:
`src/assets/images/icon.png` would compile in your `build` directory to `build/assets/images_icon.png`.

## Using Components

1. Create a `.liquid` file for your component inside any directory (e.g., `src/app/Example.liquid`).
2. At the beginning of the component file, add the comment `<!--component-->`.
3. Any content after this comment will be treated as the component's content.

`src/components/Example.liquid`
```liquid
<!--component-->
<div class="my-component">
 Content of MyComponent goes here.
</div>
```

`src/layout/theme.liquid`
```liquid
<Example/>
```

Output in `build/layout/theme.liquid`:
```liquid
<div class="my-component">
 Content of MyComponent goes here.
</div>
```

### Component with props example
Use `<<propname>>` syntax to add props to your components.
```
<!--component-->
<div class="my-component">
    Hello, <<name>>!
</div>
```

`src/layout/theme.liquid`
```liquid
<Example name="adam"/>
```

Output in `build/layout/theme.liquid`:
```liquid
<div class="my-component">
    Hello, adam!
</div>
```

### Component with children example
Use reserved `<<children>>` to specify where children in a component go:

```
<!--component-->
<div class="my-component">
    <<children>>
</div>
```

`src/layout/theme.liquid`
```liquid
<Example>
    Hello world
</Example>
```

Output in `build/layout/theme.liquid`:
```liquid
<div class="my-component">
    Hello world
</div>
```
