# Tech Stack Input Guide

## Overview

The Main Stacks input field now accepts flexible text input formats, making it easy to paste skills directly from ChatGPT or enter them manually.

## Supported Formats

### 1. Comma-Separated Values (CSV)
The simplest format - just separate skills with commas:

```
java, spring boot, aws, docker, kubernetes
```

```
React, TypeScript, Node.js, PostgreSQL
```

### 2. JSON Array Format
Copy-paste directly from ChatGPT or other tools:

```json
["java", "spring boot", "aws", "microservices", "rest api", "postgresql", "docker", "kubernetes"]
```

```json
["React", "TypeScript", "Next.js", "Redux", "Material UI"]
```

## How It Works

1. **Type or Paste**: Enter skills in either format
2. **Auto-Parse**: The system automatically detects and parses the format
3. **Visual Feedback**: See parsed skills as chips below the input
4. **Canonical Normalization**: Skills are automatically normalized (e.g., "Spring Boot" → "springboot")

## Examples

### From ChatGPT
If you ask ChatGPT to extract skills from a job description, you'll get:

```json
[
   "java",
   "spring boot",
   "aws",
   "microservices",
   "rest api",
   "postgresql",
   "docker",
   "kubernetes"
]
```

Just copy and paste this directly into the Main Stacks field!

### Manual Entry
Or type them manually with commas:

```
java, spring boot, aws, microservices, rest api, postgresql, docker, kubernetes
```

## Features

- **Flexible Input**: Accepts both comma-separated and JSON array formats
- **Real-time Parsing**: See parsed skills immediately as chips
- **Error Handling**: Clear error messages if format is invalid
- **Skill Count**: Shows how many skills were parsed
- **Canonical Matching**: Automatically normalizes skill variations

## Tips

1. **Paste from ChatGPT**: The easiest way - just copy the JSON array
2. **Use Commas**: For manual entry, separate with commas
3. **Case Insensitive**: "React", "react", "REACT" all work the same
4. **Whitespace Ignored**: Extra spaces are automatically trimmed
5. **Empty Values Filtered**: Empty strings are automatically removed

## Workflow

1. Copy job description
2. Paste into ChatGPT: "Extract tech skills from this JD as a JSON array"
3. Copy the JSON array response
4. Paste directly into Main Stacks field
5. See skills parsed and displayed as chips
6. Click "Select from History" to see matching resumes!
