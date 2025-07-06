# weymouth-waste-pickup
A simple website for getting easy answers about Weymouth, MA's trash pickup.

## Why This Exists

My neighbor was saying the town website is a pain, and she wished there was just an easy way to reference everything about trash and lawn and leaf pickup. So I said, "I can make that happen". So here's the site!

## Local Development

For local development, use the included Node.js server:

```bash
cd local-server
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

## Running Tests

The project includes tests for the core logic, particularly the yard waste date calculations:

```bash
cd test
npm install
npm test
```

## GitHub Pages

This site is deployed on GitHub Pages and loads data from JSON files. The `local-server` directory is ignored by GitHub Pages deployment.
