# Changelog

## [1.2.0] - 2022-06-05 
### Added
- New "Toggle Grid" button for quickly showing the current grid without having to go into the scene configuration.

### Changed
- Simplified the workflow. 
  - There's only one button for drawing a single grid cell. It works with both squares and hexes, depending on the current grid setting.
  - Removed the dialog asking if you want to resize the scene if the grid size turns out to be lower than 50. Now just does it automatically.
- Code simplification and cleanup.

## [1.1.0] - 2022-06-04 
### Fixed
- There are times when you would get an error about the size being an invalid value. That's been fixed.

### Changed
- Removed the popup messages that said that the grid operation was successful because they were unnecessary and slowed down the process of setting up the grid.
- Code simplification and cleanup.

## [1.0.1] - 2022-06-03
### Changed
- Updated module to point to the new repository.

## [0.0.11] - 2020-01-23 
### Added
- Added this changelog
- Added a dialog for resetting the grid

### Changed
- Updated/fixed for Foundry VTT 0.4.5
- Replaced icon for reset grid
- Moved reset grid to bottom of controls
- Renamed class to ScaleGridLayer to avoid confusion with existing DrawingsLayer
- Refactored the Scene update calls
- Some basic code linting