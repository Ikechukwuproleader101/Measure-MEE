# External Code & Libraries

This directory is for code we did not write and that we depend on or borrow: cloned repositories, vendored libraries, sample code, and model files.

## Rules & Guidelines

- **Package Managers First**: Prefer installing dependencies through a package manager (`npm`, `pip`) instead of copying code here.
- **Git Submodules**: If code must live here, prefer a **git submodule** so it stays linked to its upstream repository. Otherwise vendor it into its own subfolder.
- **Documentation Requirements**: Every subfolder must include a `SOURCE.md` listing:
  - Where it came from (upstream URL)
  - The exact version or commit hash
  - The license under which it is used
  - Why we use it in the project
- **Immutability**: Never edit files inside `external/` directly. If customizations or changes are needed, wrap or fork them externally.
- **Ownership**: Our own application code never lives here.
