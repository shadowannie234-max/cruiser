# Embody the Tranquility

Static site (HTML/CSS/JS). Push this folder to a GitHub repository to publish it.

## Publish with GitHub Pages

1. Create a new repository on GitHub and push this project (so `index.html` is at the repo root).
2. In the repo on GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. On the next push to `main` or `master`, the **Deploy site to GitHub Pages** workflow runs. When it finishes, the site is at:

   `https://<your-username>.github.io/<repository-name>/`

Your asset paths are already relative (`styles.css`, `assets/…`), so they work on GitHub Pages project URLs without extra configuration.
