# TxFlow 

Create, publish and execute arbitrary transaction flows!

TxFlow allows anyone to create flows (series of EVM transactions) and bundle them into a single unique link. This link
can be shared publicly.

## Live app

The latest application build is launched and published live [HERE](https://txflow.vercel.app/).

## Docs

To get to know how to use TxFlow and better understand the tool, head over to our [DOCS](https://txflow.gitbook.io/docs).

## Run Development build

```bash
# Install dependencies
npm i

# Run the app
npm start

```

### Using vercel cli (with backend)

If you want to simulate backend functionality, you can use vercel cli to run the app locally.

#### Prerequisites

Create a new redis instance and connect it to the app on [vercel](https://vercel.com/).

```bash
# Pull env variables from vercel
vercel env pull .env.development.local
```

#### Run the app
```bash
vercel dev
```
