# Run this tool
## Set up this tool
`npm install` to get environment running
Install `Run on Save` VSCode extension by `pucelle`

## Get map data
In the `BostonCyclistsUnion/StressMap`, download and process map data using one of the following commands:
- `py main.py process -city Boston --plot`
- `py main.py process -cities Cambridge,Boston,Somerville,Brookline --rebuild --combine --plot`

Then run
- `py database\load_into_sqlite.py --city Boston --lts-data data\Boston_4_all_lts.csv --relation-data data\boston_relations.json --node-data data\boston_nodes.json --schema database\way_schema.sql --db database\lts.db`

## Run this tool
`src/assets/bcuMap/raw/***.json`
`npm run dev`

# How to create a new layer

## Creating a route JSON
### Types of ways
- `way_fill`: string of the `name` of the street to be selected. This selects all OSM segments with the same `name` that are connected to the `startId`
-- `startId`: the `OSMID` of a way of the selected street
-- `noGoes` (optional): list of `OSMID` at either end of the street to terminate the selected way. These create the bounds of the `way_fill` 
- `way_multi_fill`: string of the `name` of the street to be selected. This selects all OSM segments with the same `name` that are connected to the `startId`, and creates multiple  
-- `startIds`: list of `OSMID` of a way of the selected street
- `way_range`
-- `name`
-- `notes`
-- `fromId`
-- `toId`
-- `noGoes`
- `way_geometry`
-- `notes`
-- `geometries`
- `way`
-- `notes`
-- `id`
- `ways`
-- `name`
-- `ids`
-- `excludeNodes`

## OSM Editing
If way_fill does not catch a separately mapped cycleway, it is likely that the `cycleway` is does not have the matching `name`. You can use this [Overpass Query](https://overpass-turbo.eu/s/2gCw) to quickly identify all separately mapped `cycleway` without a `name`. 


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
