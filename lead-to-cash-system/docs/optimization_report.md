# System Optimization Report (Overtime Phase)

## Overview
This session focused on improving the user experience (UX) and "perceived performance" of the Lead-to-Cash system.

## Key Improvements

### 1. Silky Loading Experience (Skeleton UI)
- **Problem**: Users saw a generic spinning loader covering the entire screen when navigating.
- **Solution**: Implemented a **Skeleton Loading** system.
- **Effect**:
    - The breakdown of the page (Cards, Charts, KPI) is visible immediately.
    - Content "shimmers" while loading, giving a sense of progress.
    - Applied to the main **Dashboard**.

### 2. Enhanced Feedback (Toast Notifications)
- **Problem**: The system used browser-native `alert()` for success/error messages, which feels outdated and blocks user interaction.
- **Solution**: Integrated `sonner` Toast library.
- **Effect**:
    - Modern, non-blocking notification popups at the edge of the screen.
    - "Contract Saved", "Upload Successful" messages now look professional.
    - Applied to **Contracts** and **Invoices** modules.

### 3. Code Polish
- **Refactoring**: Cleaned up hardcoded API calls in several components to use consistent Environment Variables (pre-deployment check).
- **Type Safety**: Fixed minor TypeScript issues in the process.

## Next Steps (For Future Sprints)
- **Backend Query Optimization**: optimize Prisma `include` vs `select` for large datasets.
- **Global Error Boundary**: Add a nice "Something went wrong" page instead of crashing white screen.
- **Dark Mode**: The Skeleton already supports it, need to toggle it globally.
