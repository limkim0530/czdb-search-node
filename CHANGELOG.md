## [1.0.0](https://github.com/limkim0530/czdb-search-node/compare/0.4.0...1.0.0) (2025-11-22)

### 🎉 Major Release - Production Ready

This release marks the first stable production-ready version with critical bug fixes and robustness improvements.

### 🔴 Bug Fixes

- **IPv6 Parsing**: Fixed IPv6 address parsing for edge cases (`::`, `::1`, `fe80::`, etc.)
- **Binary Search**: Fixed array bounds in binary search to prevent potential overflow
- **Resource Management**: Added try-finally blocks to prevent file descriptor leaks

### ⚠️ Breaking Changes

- None - This release is fully backward compatible

---

## [0.4.0](https://github.com/limkim0530/czdb-search-node/compare/0.3.0...0.4.0) (2025-03-30)

### Changed

- License changed from **MIT** to **Apache 2.0**.

### Features

- Add a method to retrieve the database version.

## [0.3.0](https://github.com/limkim0530/czdb-search-node/compare/0.2.0...0.3.0) (2024-09-26)

### Bug Fixes

- Synchronized a fix(https://github.com/tagphi/czdb-search-java/commit/42ca753454b675a61860f31b60b488348085ae84) from the Java version repository.
- Fixed the issue that import package cannot be used normally in ESM project, close(https://github.com/limkim0530/czdb-search-node/issues/5)
- Fix an issue where the `columnSelection` parameter from data files was not being applied correctly, leading to incorrect query results.

### Features

- Add eslint to code standard.

## [0.2.0](https://github.com/limkim0530/czdb-search-node/compare/0.1.0...0.2.0) (2024-08-25)

### Features

- Included ESM module format exports in the Rollup bundle.

## 0.1.0 (2024-07-22)

### The first pre-version of czdb-search-node released 🎉🎉
