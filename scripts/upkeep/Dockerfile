FROM node:24-bookworm
RUN npm install --global pnpm@11.15.1 @openai/codex@latest \
    && npx --yes playwright@1.63.0 install --with-deps chromium
RUN library_chrome_path=$(find /root/.cache/ms-playwright -type f -name chrome -path '*/chrome-linux*/*' | head -n 1) \
    && test -n "$library_chrome_path" && ln -s "$library_chrome_path" /usr/bin/chromium
RUN git config --system --add safe.directory /repo
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
WORKDIR /repo
