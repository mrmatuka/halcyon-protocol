# Kalandpolc development instructions

## Keep the in-app Help current

- Every new user-facing feature and every change to an existing user flow must update the in-app Help in the same pull request. Treat the Help update as part of implementing the feature.
- Edit the Hungarian and English entries together in `src/platform/helpContent.ts`. Add or revise the steps with the actual menu location, button labels, expected result, and relevant limitations. Update any illustrated controls affected by the change.
- Before marking the work complete, open **Settings → Help** and verify that the guide matches the implemented workflow, including the mobile layout where relevant.
