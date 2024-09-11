# Reshaper: Figma-like Editing Mode for Next.js & Tailwind Apps

Reshaper is a Next.js plugin that introduces a visual editing mode to your applications using Tailwind. With a Figma-like user interface, it allows developers and designers to edit components directly in the browser.

## Features

- **Visual Editing**: Switch to an intuitive Figma-like editor for direct manipulation of components.
- **Tailwind CSS Integration**: Enter values for size, margin, padding, and more, which are automatically converted to Tailwind classes.
- **Responsive Design Support**: Easily adjust layouts for different screen sizes with Tailwind’s responsive class utilities (e.g., `sm:`, `md:`, `lg:`).
- **Real-time Updates**: Changes are reflected instantly in the application as you edit.
- **Sidebar Design Panel**: Modify styling properties (e.g., margin, padding, size) using a dedicated design panel.
- **Outline Editor**: Edit the structure of your components with a sidebar that displays the JSX tree, just like Figma’s Layers panel.

## Installation

To install and use Reshaper in your Next.js application, follow the steps below:

### 1. Install the Plugin

```bash
npm install reshaper
```

### 2. Configure Next.js

In your `next.config.js`, add the following configuration to enable Reshaper:

```js
const withReshaper = require("reshaper/plugin");

module.exports = withReshaper({
  /* Your existing config */
});
```

### 3. Add the Edit Mode Button

In your layout or main component, add the Reshaper toggle button to activate the editing mode:

```jsx
import { ReshaperToggle } from "reshaper";

export default function Layout({ children }) {
  return (
    <>
      <ReshaperToggle />
      {children}
    </>
  );
}
```

## Usage

### Enter Edit Mode

Once you’ve set up Reshaper, open your Next.js application and click the **Edit Mode** button. The Figma-like UI editor will open, allowing you to:

1. **Visually modify component styles** in real time.
2. **Edit the element structure** using the Layers-like sidebar panel.

### Element Tree Editing

The sidebar displays the element structure of your components, allowing you to easily:

- Drag and drop components to rearrange the hierarchy.
- Add or remove elements.
- Edit properties of the selected element.

### Tailwind Class Conversion

Modify size, margins, and paddings in the sidebar panel, and Reshaper will convert your input into the appropriate Tailwind CSS classes. No need to write any code—just input your desired values!

### Responsive Design

Reshaper supports responsive design by allowing you to configure styles for different screen sizes. Use the sidebar to set values for different breakpoints, and Reshaper will generate the corresponding responsive Tailwind classes.

## Roadmap

- [ ] Basic support for Tailwind classes.
- [ ] Modify component structure with the outline editor.
- [ ] Responsive design support.
- [ ] Add custom Tailwind configurations.
- [ ] Support for other frameworks

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub. Please follow the contributing guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
