# Administrator and agent workflow

1. Read the request, inspect current files/status, and research what is needed. Resolve routine implementation choices independently.
2. Make the smallest useful edit. Verify with `pnpm check` and `pnpm build`.
3. Run `pnpm assistant:prepare`; it saves the built site under an immutable SHA-256 digest in `output/releases/`. Keep the manifest and previous release.
4. Run `pnpm assistant:capture -- <digest>` to render that saved release on desktop and phone. Inspect the real screenshots, browser errors, and internal links. The script records evidence in `output/playwright/<digest>/`.
5. For an online preview, set `CLOUDFLARE_PREVIEW_PROJECT` to a dedicated demo/preview Pages project and run `pnpm assistant:preview -- <digest>`. Its production branch must be `production`; preview uploads always use `draft-<digest>`. This project must never have the library's real domain attached.
6. Give the volunteer the screenshots and immutable deployment URL. Ask for approval of this version. Keep the approved digest with the chat record.
7. Production is intentionally unavailable to these scripts. Before launch, connect a human-controlled publishing service that authenticates the reviewer, binds approval to this digest, verifies the stored asset hashes, publishes those same assets, and retains/verifies rollback. Do not pass production credentials into the agent environment or represent Markdown instructions as an enforced approval gate.

## Cloud environment

Connect this private repository in ChatGPT Work → Cloud. Use `bash scripts/cloud-setup.sh` as the install script. Use `assistant/START.md` as the start instructions. Publish the prepared environment after setup and checks succeed. Test a new task, rather than relying only on the environment setup conversation.

Verified entry point on Jaden's account: `https://chatgpt.com/codex/cloud`. It opens the Cloud composer. Select the published `cottonwood-library-assistant` environment before sending a website request. An ordinary ChatGPT project chat does **not** automatically connect to this environment merely because its instructions mention the name. The separate Cottonwood Library Assistant project contains the friendly persona instructions, but is not itself the coding workspace.

The published install/start configuration additionally puts pnpm and caches under `/workspace`, because the default home directories in this cloud runtime were unwritable. Keep that tested wrapper when updating the environment.

Allow package/download hosts during installation. Browser installation may require system dependencies. Do not put secrets in the repository. Add only preview project credentials to the environment's secret store after testing the dedicated preview project. Account linking and publishing the cloud environment require the signed-in account UI.
