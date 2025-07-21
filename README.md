# YCB Markdown Plugin

An Obsidian plugin that converts nested bullet lists to JSON format and uploads them to Your Common Base (YCB) while maintaining hierarchical relationships.

## Features

- **Save Thread**: Converts nested bullet lists to JSON format and copies to clipboard
- **Upload Thread to YCB**: Directly uploads nested bullet lists to YCB API with parent/child relationships preserved

## Usage

### Converting Nested Lists

The plugin processes nested bullet lists like:
```markdown
- node
    - nested
        - nested 2
    - not nested
- node 2
- node 3
```

Into JSON format with hierarchical relationships:
```json
[
  {
    "id": "node_1",
    "content": "node",
    "metadata": {
      "alias_ids": ["node_2", "node_3"]
    }
  },
  {
    "id": "node_2", 
    "content": "nested",
    "metadata": {
      "parent_id": "node_1",
      "alias_ids": ["node_4"]
    }
  }
]
```

### Commands

1. **Save Thread** - Converts selected text (or entire document) to JSON and copies to clipboard
2. **Upload Thread to YCB** - Uploads the hierarchical structure directly to your YCB instance

Access commands via:
- Command Palette (`Ctrl/Cmd + P`)
- Type "Save Thread" or "Upload Thread to YCB"

## Configuration

1. Go to Settings → Plugin Options → YCB Markdown Plugin
2. Configure:
   - **YCB URL**: Your YCB instance URL (default: https://yourcommonbase.com/backend)
   - **YCB API Key**: Your YCB API authentication token

## Installation

### Manual Installation
1. Download the latest release
2. Extract files to `VaultFolder/.obsidian/plugins/ycb-md/`
3. Enable the plugin in Obsidian settings

### Development
```bash
# Clone and install dependencies
git clone [repository-url]
cd ycb-md
npm install

# Development mode with auto-compilation
npm run dev

# Build for production
npm run build
```

## How It Works

The plugin:
1. Parses indented bullet lists to identify hierarchical structure
2. Creates unique IDs for each node
3. Maintains parent/child relationships via `parent_id` and `alias_ids`
4. For YCB upload: processes nodes in order (parents before children) to preserve relationships
5. Maps internal node IDs to YCB-returned IDs for proper relationship linking

## Requirements

- Obsidian v0.15.0+
- Valid YCB API key for upload functionality