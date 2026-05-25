# Instructions: Deneth's Mobile Finance & Loan Tracker System

This document provides the complete, updated Business and Technical Requirements for building Deneth’s personalized mobile finance tracker. It serves as a master blueprint for frontend design and JavaScript logical implementation.

The app uses a lightweight, local-first tech stack (**HTML, CSS, JavaScript, Tailwind CSS, Dexie.js**) optimized for a standalone Android App wrapper environment.

---

## 1. Simplified Business Requirements (Functional Specifications)

### 1.1 Income & Expense Modals (Daily Tracker)
Deneth must be able to quickly log daily income and expenses on the move with minimal data entry.
* **Transaction Types:** Must distinguish clearly between `Income` and `Expense`.
* **Required Fields Only:**
    1.  **Description** (e.g., "Salary", "Fuel", "Lunch", "Bought tools") - *Text Input*
    2.  **Amount (Rs.)** (e.g., 5000, 1250) - *Numeric Input*
    3.  **Date** (Defaults to today, but user can pick any date) - *Date Picker*

### 1.2 Interactive Loan Registry (Naya Tracker)
A isolated section dedicated to keeping tabs on money lent to friends, featuring real-time settlement tracking.
* **Required Fields:**
    1.  **Friend's Name** (Whom was it given to?) - *Text Input*
    2.  **Amount Lent (Rs.)** (How much was given?) - *Numeric Input*
    3.  **Date Lent** (When was it given?) - *Date Picker*
* **Status Management:** Every loan defaults to a **"Pending"** state.
* **The Settle Action:** Next to every pending loan entry, there must be an interactive **"Tick / Checkbox" or Button** labeled **"Mark as Recovered"** (Apahu Labuna). Clicking this updates the entry status to **"Settled"** instantly.

### 1.3 Historical Reports & Monthly Filtration
* **Lifetime Storage:** The app must retain every record safely from the very first day it is installed and launched.
* **Month-by-Month Filter Selector:** * A dropdown menu listing months (e.g., "2026 May", "2026 April").
    * Selecting a month will immediately isolate and display only the Income and Expense logs created within that chosen period.
* **Loan Overview Panel:** A dedicated view to see all historical loan data, sorted into two clean tabs: "Active Loans" (Thama Hambune Nathi) and "Settled Loans" (Bera gaththa ewa).

---

## 2. Technical Stack Configuration

* **UI Layout:** Tailwind CSS (Mobile-responsive layouts using `max-w-md mx-auto` structure to mimic native Android UI).
* **Database Management:** Dexie.js (Wrapper for browser IndexedDB). This keeps all of Deneth's sensitive data stored privately inside his own phone's storage—no server, internet, or login required.

---

## 3. Database Schema Blueprint (Dexie.js Syntax)

Initialize the database using the specific keys matching the business workflows:

```javascript
const db = new Dexie("DenethFinanceAppDB");

// DB Schema Setup
db.version(1).stores({
    cashflow: '++id, type, description, amount, date',
    loans: '++id, friendName, amount, date, status'
});