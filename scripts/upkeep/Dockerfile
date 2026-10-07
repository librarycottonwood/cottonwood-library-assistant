FROM node:24-bookworm
RUN npm install --global pnpm@11.15.1 @openai/codex@0.156.0 \
    && npx --yes playwright@1.63.0 install --with-deps chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
WORKDIR /repo
