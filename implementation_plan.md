# Implementation Plan - Interactive Budget Chart

## Goal
Allow the user to click on the Circular Budget Chart to toggle the display between the **Percentage Consumed** (default) and the **Total Spent Amount**.

## Proposed Changes

### Logic
#### [MODIFY] [app.js](file:///s:/pogramming/Basics%20C%20program/BOYS_Expense_Tracker/app.js)
- Add a state variable `showChartAmount` (boolean) to track the display mode.
- Add a click event listener to the `.circular-chart` element.
- Update `updateDashboard()` to respect this state:
    - If `false` (default): Show Percentage (e.g., "62%") and label "Spent".
    - If `true`: Show Total Amount (e.g., "₹450") and label "Total".

### UI/UX
- Add `cursor: pointer` to the chart container in CSS to indicate interactivity.
- Ensure the font size adjusts if the amount is large (though the existing `fit-content` or similar logic might handle it, we might need a small CSS tweak for long numbers inside the circle).

## Verification Plan
### Manual Verification
1.  Click the chart on the dashboard.
2.  Verify it switches from "%" to "₹".
3.  Add a transaction and verify both views update correctly.
