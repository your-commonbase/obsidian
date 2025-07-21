# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with automatic compilation and watch mode
- `npm run build` - Build for production (includes TypeScript type checking)
- `npm i` - Install dependencies
- `npm version patch|minor|major` - Bump version in manifest.json, package.json, and versions.json

## Architecture

This is an Obsidian plugin built with TypeScript and esbuild. The main plugin class extends Obsidian's `Plugin` class and demonstrates core plugin capabilities:

- **Main Plugin Class** (`MyPlugin` in `main.ts`): Handles plugin lifecycle, commands, settings, and UI components
- **Settings System**: Uses `MyPluginSettings` interface with persistent storage via `loadData()`/`saveData()`
- **Modal Components**: Custom modals extending Obsidian's `Modal` class
- **Settings Tab**: Plugin settings UI via `PluginSettingTab`

## Plugin Structure

- `main.ts` - Core plugin logic with ribbon icons, commands, modals, and settings
- `manifest.json` - Plugin metadata and Obsidian compatibility info
- `package.json` - Build configuration using esbuild
- `styles.css` - Plugin-specific styling
- `versions.json` - Version compatibility mapping

## Obsidian API Usage

The plugin demonstrates key Obsidian API patterns:
- Ribbon icons and status bar items
- Command registration (simple, editor-based, and conditional)
- DOM event handling with automatic cleanup
- Plugin settings with UI
- Modal dialogs

## Build System

Uses esbuild via `esbuild.config.mjs` for fast compilation. TypeScript compilation is done separately for type checking during build.