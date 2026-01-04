# RealTimeX CRM Documentation

This project contains the source code for the RealTimeX CRM documentation, built with [Starlight](https://starlight.astro.build/).

## 🚀 Getting Started

To run the documentation site locally:

1.  Navigate to the `doc` directory:
    ```bash
    cd doc
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The documentation will be available at `http://localhost:4321/realtimex-crm/doc/`.

## 📁 Content Structure

All documentation pages are located in `src/content/docs/`:
- `index.mdx`: Home page / Getting Started.
- `users/`: User-facing documentation.
- `developers/`: Documentation for developers and contributors.

## �️ Build and Deploy

To build the static site:
```bash
npm run build
```
The output will be in the `dist` directory.
