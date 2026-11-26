# Contributing to Morrow

Thanks for helping improve Morrow. Focus changes on a clear user need and preserve its local-first, no-build architecture.

## Before you start

- Search existing issues and pull requests before opening a duplicate.
- For a substantial change, open an issue first to agree on scope.
- Keep personal travel data, credentials, and other private information out of issues and screenshots.
- Avoid adding dependencies or paid services unless the maintainers agree they are necessary.

## Local development

1. Fork the repository and create a focused branch.
2. Open `index.html` in a modern browser, or serve the project with a static web server such as VS Code Live Server.
3. Make the smallest change that addresses the issue; follow the existing vanilla JavaScript, HTML, and CSS patterns.
4. For JavaScript changes, run:

   ```sh
   node --check app.js
   node --check morrow3.js
   ```

5. Test the affected flow in a browser, including a narrow viewport when the UI changes. The project does not currently have an automated browser test suite.
6. Update the README or architecture notes when behavior or setup changes.
7. Open a pull request using the checklist and include before/after screenshots for visual changes.

## Pull requests

- Keep each pull request focused and explain the user-visible effect.
- Call out manual verification and any limitations.
- Do not claim optional AI, weather, maps, or simulated group planning works as a live service when it does not.
- Keep commits free of generated files, secrets, and personal browser data.

By submitting a contribution, you agree that it is provided under the repository's MIT License.
