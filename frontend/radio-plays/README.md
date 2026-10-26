# radio-plays frontend

React app for mahushma.com, built with [Vite](https://vite.dev).

## Scripts

Run in this folder:

- `npm start` starts the dev server on http://localhost:3000. Set `PORT` to
  use another port.
- `npm run build` writes the production build to `build/`, which the
  Dockerfile and Netlify serve.
- `npm test` runs the Vitest tests in watch mode; `npx vitest run` runs them
  once.
- `npm run preview` serves the production build locally.

## API address

`REACT_APP_API_BASE_URL` sets the API the browser calls (the old
create-react-app name is kept on purpose, so Docker, the Pi and Netlify need no
changes). When it is empty:

- the dev server calls `http://localhost:5000`;
- a production build calls the same-origin `/api/...`, which nginx proxies to
  the API container.

The API usually runs on 5050 locally, because 5000 is taken by another
project:

```bash
BROWSER=none PORT=3000 REACT_APP_API_BASE_URL=http://localhost:5050 npm start
```

Files containing JSX use the `.jsx` extension; Vite does not compile JSX in
`.js` files.
