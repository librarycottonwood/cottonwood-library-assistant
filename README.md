# Cottonwood Community Library website

[![Verify library website](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/workflows/check.yml/badge.svg)](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/workflows/check.yml)

The website of the [Cottonwood Community Library](https://cottonwood-library.pages.dev/) in Cottonwood, California, and the ChatGPT assistant its staff use to update it. Staff ask for a change, check a preview and approve it before it goes live. Every change is a pull request and can be undone.

Built with Astro, Sanity and Cloudflare Pages. Deploys come only from GitHub Actions.

## Layout

- `src/`: the website
- `studio/`: Sanity Studio (content editor)
- `plugins/cottonwood-library/`: the ChatGPT assistant's skills
- `cms-publisher/`, `connector/`, `functions/`: Cloudflare Workers and the newsletter function
- `assistant/`, `docs/`: workflow, handoff and design notes. Agents start at [AGENTS.md](AGENTS.md).

## Development

Node 24, pnpm 11.15.1.

```sh
pnpm install
pnpm dev     # sample content, no accounts needed
pnpm check
pnpm build
```

Never deploy from a computer.

## License

Code: [MIT](LICENSE). The library's name, logo, photos and written content aren't covered. Outside pull requests aren't accepted ([CONTRIBUTING.md](CONTRIBUTING.md)); report security issues per [SECURITY.md](SECURITY.md).
