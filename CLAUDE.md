# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone HTML/JavaScript web application that provides waste pickup scheduling information for Weymouth, MA residents. The application allows users to enter their address and get information about:
- Regular trash pickup day
- Holiday delays
- Yard waste pickup schedule (biweekly zones A/B)

## Architecture

### Single File Application
- **index.html**: Complete self-contained application with inline CSS and JavaScript
- No build process or external dependencies
- All data is embedded inline or loaded from JSON files

### Data Structure
The application uses three main data sources located in `data/2025/`:
- **holidays.json**: Holiday dates that affect pickup schedules
- **yardwaste.json**: Biweekly yard waste pickup schedule for zones A and B
- **streets-[a-z].json**: Street address ranges with pickup day and zone assignments

Each street entry contains:
- `street`: Street name (uppercase)
- `low`/`high`: Address number ranges
- `day`: Pickup day (Monday-Friday)
- `zone`: Yard waste zone (A or B)

### Key Functions
- `parseAddress()`: Extracts house number and street name from user input
- `findStreetInfo()`: Matches address to street data with range validation
- `checkHolidayDelay()`: Determines if holidays affect current/next week pickup
- `checkYardWastePickup()`: Checks if current week has yard waste pickup for zone
- Address autocomplete with keyboard navigation

## Data Management

### Street Data Format
Streets can have multiple entries for different address ranges (e.g., BROAD ST has 5 different entries for different number ranges with different pickup days).

### Holiday Logic
Holidays only affect pickup if they fall on weekdays (Monday-Friday). The system checks both current week and next week for holiday impacts.

### Yard Waste Schedule
- Zone A and B have alternating biweekly schedules
- Dates are stored as ISO format strings (YYYY-MM-DD)
- Schedule runs approximately April through December

## Testing

Since this is a client-side only application with no build process:
- Test by opening index.html in a web browser
- Verify address parsing with various formats
- Test holiday delay logic around holiday dates
- Confirm yard waste schedule accuracy for both zones

## Development Notes

- All data is currently hardcoded for 2025
- Street data includes exact address ranges - verify against official Weymouth data when updating
- LocalStorage is used to save user's last searched address
- Application is fully responsive for mobile devices