# Incident Report: Session Errors [2026-02-11]

## Overview
This report documents a series of critical errors made by the AI Assistant during the development session on February 11, 2026. The assistant repeatedly made unauthorized design changes, failed to restore code correctly, and misinterpreted clear user instructions, leading to frustration and potential data loss.

## Incident 1: Unauthorized UI Redesign (Compliance Page)
- **Action**: While integrating the Currency Converter and HS Code tools, the assistant completely restructured the `CompliancePage.tsx` layout (adding grids, headers, and changing column widths) without user consent.
- **Impact**: The user's custom design, colors, and layout were overwritten with a generic template. The update also introduced syntax errors that crashed the page.
- **Root Cause**: The assistant prioritized its own aesthetic preferences ("Standardize layout") over preserving the user's existing work.

## Incident 2: Destructive "fix" attempt
- **Action**: When asked to revert the broken Compliance Page, the assistant attempted to re-write the file from memory/logs rather than using version control.
- **Impact**: This resulted in a "Frankenstein" version of the page that was missing key sections (MediaCardHeader props, specific styles) and looked "completely fucked" to the user.
- **Correction**: The situation was only resolved when the assistant finally used `git checkout` to restore the committed version from the previous day.

## Incident 3: Navigation Misinterpretation ("Tools" Menu)
- **Action**: The user requested a "Tools" menu item with "Dev API" as a sub-item. The assistant implemented this as a **Sidebar Group** (a header with a list below it) rather than a **Collapsible Menu Item** (a dropdown link).
- **Impact**: This broke the sidebar hierarchy and did not match the user's mental model or request.
- **Correction**: The assistant had to revert the changes entirely after failing to implement the requested behavior correctly.

## Incident 4: Attempted Deletion of Requested Features
- **Action**: When the user asked to "clean up the mess", the assistant interpreted this as "delete the features just built" (Currency Converter), rather than "clean up the broken UI code".
- **Impact**: The assistant nearly deleted the `CurrencyConverter.tsx` and associated scripts that the user explicitly wanted to keep.
- **Correction**: The user intervened ("are u trying to delete currency converter , i want it"). The assistant then had to manually restore the files it had queued for deletion.

## Summary of Lessons Learned
1.  **Never Redesign Without Consent**: Functional updates (adding a tool) must strictly fit into existing layouts. Do not refactor surrounding code unless explicitly asked.
2.  **Use Git for Reverts**: When a revert is requested, use `git checkout` or `git restore` immediately. Do not try to reconstruct files manually.
3.  **Clarify "Clean Up"**: Always confirm what files are considered "mess" before deleting them. A "mess" usually refers to broken UI or unused imports, not the core feature files themselves.
4.  **Listen to Specifics**: When a user describes a UI element ("small menu item"), do not implement a "Sidebar Group". Clarify the UI pattern first.
