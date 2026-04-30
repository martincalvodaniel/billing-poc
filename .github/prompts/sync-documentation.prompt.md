# Sync Documentation & Keep Guidelines Updated

Update and maintain the three documentation files to ensure consistency and clarity for all developers and AI agents.

## Documentation Hierarchy

### 1. **README.md** - Project Overview (User-Facing)
**Purpose**: Quick onboarding for new developers joining the project

**Should contain:**
- Clear project description and purpose
- Feature list (what the app does)
- Quick start instructions
- Links to detailed guides (point to AGENTS.md)
- Tech stack overview
- Deployment instructions
- Roadmap/Future plans

**Should NOT contain:**
- Detailed code patterns (→ AGENTS.md)
- Development guidelines (→ AGENTS.md)
- Architecture deep dives (→ AGENTS.md)

### 2. **AGENTS.md** - Development Guidelines (Developer-Facing)
**Purpose**: Comprehensive guide for developers and AI agents building features

**Should contain:**
- Architecture patterns and data flow
- Code style conventions (TypeScript, React, API routes)
- Type safety guidelines with examples
- Common tasks & step-by-step patterns
- Database operation patterns
- Form handling patterns
- Validation patterns
- Error handling best practices
- Development workflow and setup
- File access guidelines
- Debugging tips
- Security notes
- Future development patterns for roadmap items

**When to update**: After any architectural decision, code pattern change, or when adding new features to the roadmap.

### 3. **.github/copilot-instructions.md** - Copilot Context (AI-Facing)
**Purpose**: Quick reference for GitHub Copilot to maintain consistency in every iteration

**Should contain:**
- Key principles summary (from AGENTS.md)
- Essential code patterns (3-4 must-use patterns)
- Before-completing-tasks checklist
- Reference links to AGENTS.md and README.md

**When to update**: Whenever AGENTS.md key principles or patterns change.

## Update Workflow

When implementing a new feature or making architectural changes:

1. **If it affects code patterns:**
   - Update `AGENTS.md` with the new pattern
   - Update `.github/copilot-instructions.md` essential patterns if it's a core pattern

2. **If it affects user-facing functionality:**
   - Update `README.md` Features section
   - Update `AGENTS.md` if implementation patterns changed

3. **If it affects development setup/process:**
   - Update `AGENTS.md` Development Workflow section
   - Update `README.md` Getting Started if prerequisites changed

4. **If roadmap item is implemented:**
   - Move from `[ ]` to `[x]` in both `README.md` and `AGENTS.md`
   - Document new patterns in `AGENTS.md` if applicable
   - Add to "Future Development Guidelines" section if it becomes a pattern

## Sections Needing Sync

### Tech Stack Changes
- Update `README.md` → Tech Stack section
- Update `AGENTS.md` → Project Overview → Key Characteristics
- Update `.github/copilot-instructions.md` if major tech changes

### New API Endpoints
- Add to `README.md` → API Endpoints section (what it does, request/response)
- Add pattern to `AGENTS.md` → Common Tasks if it's a repeatable pattern
- Verify `.github/copilot-instructions.md` covers validation

### New Component Types
- Add to `AGENTS.md` → Code Style & Conventions if new pattern
- Update `.github/copilot-instructions.md` if essential to all components
- Add example to component structure if applicable

### New Database Operations
- Document pattern in `AGENTS.md` → Database Operations
- Add to Code Style & Conventions if it's a common pattern
- Ensure type safety guidelines cover it

### Build/Development Process Changes
- Update `AGENTS.md` → Development Workflow
- Update `README.md` → Getting Started if significant
- Update `.github/copilot-instructions.md` if it affects all tasks

## Validation Checklist

Before considering documentation complete:

- [ ] `README.md` matches actual project features and setup
- [ ] `AGENTS.md` reflects all established patterns in the codebase
- [ ] `.github/copilot-instructions.md` references match AGENTS.md sections
- [ ] All code examples in docs are accurate and follow shown patterns
- [ ] Links between documents are correct
- [ ] Roadmap status (`[x]` vs `[ ]`) is consistent across files
- [ ] No contradictions between documents
- [ ] New patterns are documented before implementing wide adoption

## Common Scenarios

### Adding a new validated API endpoint for a different resource
1. Add example to `AGENTS.md` → Common Tasks & Patterns → Adding a New API Endpoint
2. Document endpoint in `README.md` → API Endpoints with request/response
3. Verify validation patterns in `.github/copilot-instructions.md` include this case

### Implementing a roadmap feature (e.g., edit/delete, authentication)
1. Move checkbox in `README.md` and `AGENTS.md` from `[ ]` to `[x]`
2. Add pattern documentation to `AGENTS.md` → Future Development Guidelines (now past work)
3. Update `AGENTS.md` → Common Tasks if applicable
4. Review `.github/copilot-instructions.md` to see if new essential patterns apply

### Changing code style/conventions (e.g., new TypeScript constraint)
1. Update all affected sections in `AGENTS.md`
2. Update `.github/copilot-instructions.md` Key Principles if fundamental
3. Update README.md only if it's a user-visible change
4. Add before-completing checklist items if it affects all tasks

### Adding new environment variables or config
1. Update `AGENTS.md` → Environment Variables section
2. Update `README.md` → Getting Started if end-user needs to configure it
3. Update `AGENTS.md` → Setup section in Development Workflow if dev-only

## Key Principles for Documentation

✅ **Single source of truth**: Don't duplicate patterns - reference instead  
✅ **Keep it current**: Update immediately after code changes, not later  
✅ **Clarity over completeness**: Better to be concise and clear than verbose  
✅ **Examples matter**: Include code examples for abstract patterns  
✅ **Link docs together**: Users should navigate naturally between files  
✅ **Different audiences**: README for users, AGENTS.md for builders, copilot-instructions for AI agents  

