# Contributing to Special Ed 3000

Thank you for your interest in contributing to **Special Ed 3000**! We welcome contributions from special education teachers, assistive technologists, therapists, and engineers.

## Development Workflow

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/your-username/special-ed-3000.git
   cd special-ed-3000
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
4. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Verify Code Quality & Build**:
   ```bash
   npm run build
   ```
6. **Submit a Pull Request** with a clear explanation of the educational benefit or technical improvement.

## Guiding Principles

- **Student Privacy First**: Special Ed 3000 is strictly local-first. Never introduce architecture that transmits unencrypted student records to third-party databases.
- **Universal Design for Learning (UDL)**: Ensure UI components are high-contrast, keyboard-navigable, screen-reader friendly, and supportive of sensory accommodations.
- **Fault-Tolerant & Offline-Resilient**: AI generators must always have graceful fallbacks so classroom instruction is never interrupted if an API endpoint is unavailable.

## Questions & Feedback

Open an issue on GitHub to discuss ideas, report bugs, or request new curriculum material formats.
