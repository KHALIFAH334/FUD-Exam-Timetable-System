# FUD Examination Timetable System
## Documentation vs. Software — Audit Summary Report

*Prepared: 9 September 2026*

---

## What Was Reviewed

This report summarises a side-by-side comparison between **three written documentation chapters** and the **actual software that has been built** for the FUD Examination Timetable System project.

The three documents reviewed are:

| Document | Covers |
|---|---|
| **Chapter One — Introduction** | The project's background, aims, objectives, and scope |
| **Chapter Two — Literature Review** | Previous research and existing systems in this area |
| **Chapter Three — Research Methodology** | How the system was designed, what technology was chosen, and what features were promised |

The software reviewed is the complete codebase of the FUD Examination Timetable System — both the server (backend) and the user interface (frontend).

---

## What Works Well

Before discussing what needs attention, it is important to acknowledge what the project **gets right**. A significant amount of working software has been built, and many of the project's stated goals have been achieved:

- ✅ **The scheduling engine works.** The system can automatically generate an examination timetable that avoids clashing exams for the same student, respects venue capacity limits, and assigns invigilators fairly — which is the core promise of the project.

- ✅ **Data management is comprehensive.** Examination officers can manage courses, departments, venues, invigilators, students, academic sessions, time slots, and blackout dates (such as public holidays) through a purpose-built web interface.

- ✅ **Conflict detection is functional.** The system identifies which courses share students and uses this information to prevent scheduling clashes before a timetable is ever published.

- ✅ **Timetable export is implemented.** Officers can download generated timetables in both Excel and PDF formats, complete with the university branding.

- ✅ **Version management exists.** Multiple drafts of a timetable can be created, reviewed, published, and archived — matching the real-world revision cycle described in the methodology chapter.

- ✅ **A feedback/complaints system exists.** A mechanism is in place for people to submit complaints about a published timetable (e.g. reporting a clash or a wrong venue), and for officers to review and respond to those complaints.

- ✅ **Security is in place.** The system uses password encryption and token-based authentication to protect access.

---

## What Needs Attention

The issues found are grouped below by urgency. Think of 🔴 as things that should be fixed before submission, 🟡 as things that weaken the project if left as-is, and 🟢 as minor improvements.

---

### 🔴 Issues That Must Be Addressed

#### 1. A Reference Date Is Wrong
**The problem:** In Chapter One, a key research paper is cited as "Qu et al., 2020." The correct year is **2009** — the same paper is cited correctly everywhere else in the document. This is a simple typo, but an examiner checking references will notice it immediately.

**The fix:** Change "2020" to "2009" in Chapter One, paragraph 1.1 (a one-word correction).

---

#### 2. The Write-Up Promises a Feature the Software Doesn't Have — "Forward Checking"
**The problem:** Chapter Three (§3.7.1) states that the scheduling engine uses *"backtracking search with constraint propagation (including forward checking)."* In plain terms, forward checking is a technique that helps the system look ahead and avoid dead ends while building a timetable. **The software does not actually do this.** It uses a simpler approach — plain backtracking — which still works, but is not what the documentation claims.

**The fix (choose one):**
- *Option A* — Remove the words "constraint propagation (including forward checking)" from the methodology chapter and describe what the system actually does.
- *Option B* — Add the forward-checking feature to the software so the documentation is accurate.

Option A is far quicker and is the recommended approach unless there is time to implement the feature.

---

#### 3. "Soft Constraints" Are Discussed But Never Implemented
**The problem:** Both the literature review and the methodology chapter discuss *soft constraints* — preferences like spreading a student's exams evenly across the exam period and avoiding back-to-back exams on the same day. The documentation says the system *"attempts to satisfy [these] as far as possible."* In reality, the software **does not consider soft constraints at all**. It only enforces the strict rules (no clashing exams, no exceeding venue capacity).

**The fix (choose one):**
- *Option A* — Add a clear statement in Chapter Three acknowledging that soft constraints were not implemented in this version, and list this as a recommendation for future work.
- *Option B* — Add soft constraint logic to the scheduling engine (a more significant piece of development work).

---

#### 4. The Software Has No Automated Tests
**The problem:** There is no way to automatically verify that the system works correctly. The backend has no tests at all, and the frontend contains a single leftover test from the initial project template that does not actually test anything meaningful. For a project of this scope, the absence of tests is a notable gap — especially since the methodology chapter (§3.7, Step 5) lists *"Testing: Verifying that the implemented system correctly enforces scheduling constraints"* as a stage of the development process.

**The fix:** Write automated tests for the most critical parts of the system, particularly the scheduling engine, conflict detection, and user login. This would also strengthen the evaluation chapter (Chapter Five).

---

### 🟡 Issues That Should Be Addressed

#### 5. The Technology Table Lists Tools That Were Not Used
**The problem:** The hardware and software table in Chapter Three (§3.10) lists **"PHP (Laravel)"** as a backend technology and **"XAMPP/WAMP"** as a development tool. Neither of these was used. The system is built entirely with Node.js and Express.js.

**Why it matters:** An examiner or external reviewer comparing the documentation to the code will immediately see this inconsistency, which undermines confidence in the accuracy of the rest of the write-up.

**The fix:** Update the table to list "Node.js" and "Express.js" as backend technologies, "npm" and "nodemon" as development tools, and remove PHP, Laravel, XAMPP, and WAMP.

---

#### 6. The "Role-Based Portal" Works Differently Than Described
**The problem:** Multiple sections across all three chapters describe a system where **class representatives and course lecturers log in** to view published timetables and submit complaints. In the actual software, there is no login for class representatives or lecturers. Instead, examination officers generate a **shareable link** which anyone with the link can use to view the timetable and submit feedback — without logging in.

**Why it matters:** The token-based link approach is a valid design choice and arguably more practical (class reps don't need to be registered as users). However, the documentation consistently describes it as an authenticated, role-based login system, which is not accurate.

**The fix:** Update the relevant sections in all three chapters to describe the actual token-based public feedback approach, rather than the login-based approach that was originally envisioned.

---

#### 7. The System Records When Timetables Are Deleted, But Not When They Are Changed
**The problem:** Chapter Three (§3.8.1) requires the system to *"maintain an audit trail of changes made to the timetable after initial generation."* The database has a table set up for this purpose, and the system checks it when someone tries to delete a timetable. However, **nothing in the software ever writes to this audit log** — changes are made without being recorded.

**The fix:** Add code so that whenever a timetable is created, modified, published, or archived, a record is automatically saved to the audit log.

---

#### 8. Manual Edits to a Timetable Are Not Re-Checked for Clashes
**The problem:** Chapter Three (§3.8.1) says the system should *"allow manual override and adjustment of automatically generated schedules by authorised staff, with re-validation against constraints."* The system does allow manual adjustments, but it **does not re-check the adjusted timetable for new clashes** afterward. This means an officer could accidentally introduce a conflict that the original automated system would have prevented.

**The fix:** Add a validation step that runs the same clash-detection checks after any manual edit.

---

#### 9. The Literature Review Summary Doesn't Match the Chosen Approach
**The problem:** The closing paragraph of Chapter Two (§2.5) positions the project as using a *"hybrid scheduling engine."* However, Chapter Three explicitly explains that the project chose a pure constraint-based approach (CSP) **instead of** a hybrid approach, for reasons of simplicity and verifiability. The conclusion of Chapter Two should match what was actually built.

**The fix:** Reword the Chapter Two summary to say *"constraint-based scheduling engine"* instead of *"hybrid scheduling engine."*

---

#### 10. Handling of Carry-Over and Spill-Over Students Is Incomplete
**The problem:** Chapter Three (§3.8.1) and the study of the existing system (§3.4) describe how carry-over and spill-over students should be handled — by scheduling their affected exams at a different time slot on the same date as the main cohort. The database has fields set up for this, but the **scheduling engine does not actually implement this logic**. All courses are currently scheduled identically regardless of whether they involve carry-over students.

**The fix:** Either implement the carry-over scheduling logic or document this as a known limitation and future work item.

---

#### 11. No Automatic Notifications for New Complaints
**The problem:** Chapter Three (§3.8.1) says the system should *"notify examination officers of newly submitted complaints."* Currently, officers must manually open the complaints page to see if any new complaints have been submitted — there are no email alerts, pop-up notifications, or any other automatic notification mechanism.

**The fix:** Add a simple notification feature, or document this as a limitation.

---

### 🟢 Minor Issues

#### 12. Two Literature References Could Not Be Independently Verified
The citations for *Adewole & Eze (2022)* and *Ibrahim, Yusuf & Aliyu (2023)* reference journals that are not widely indexed in major academic databases. This does not necessarily mean they are incorrect, but an examiner may question them.

**Recommendation:** If possible, add DOI numbers or direct URLs to these references.

---

#### 13. An Extra Scheduling Rule Exists in the Code But Not in the Documentation
The software enforces a rule that no two exams from the same department and the same level can be scheduled on the same day. This is a sensible rule, but it is **not mentioned anywhere** in the documentation.

**Recommendation:** Add this constraint to the list in Chapter Three (§3.7.1).

---

#### 14. No Setup Instructions in the Repository
A new developer picking up this project would not know what database settings, passwords, or configuration values are needed to run the system, because no template configuration file is provided.

**Recommendation:** Add a `.env.example` file listing the required settings with placeholder values, and include basic setup steps in the project README.

---

## Recommended Action Plan

The table below groups the fixes by how much effort they require, so you can prioritise what to tackle first:

| Time Needed | What to Do | Issue(s) |
|---|---|---|
| **Under 30 minutes** | Fix the citation date (2020 → 2009) | #1 |
| | Update the technology table in Ch. 3 | #5 |
| | Reword "hybrid" → "constraint-based" in Ch. 2 summary | #9 |
| | Add the undocumented scheduling rule to Ch. 3 | #13 |
| **1–2 hours** | Remove forward-checking claim from Ch. 3 (if not implementing it) | #2 |
| | Add soft constraints as a stated limitation and future work item | #3 |
| | Update role-based portal descriptions to match actual token-based approach | #6 |
| | Add `.env.example` and setup instructions | #14 |
| **Half a day** | Add audit-trail logging code | #7 |
| | Add constraint re-validation after manual edits | #8 |
| **1–2 days** | Write automated tests for the scheduling engine and core features | #4 |
| | Implement carry-over/spill-over scheduling (if desired) | #10 |
| | Add notification feature for new complaints (if desired) | #11 |

> [!TIP]
> **If time is limited**, addressing items #1, #2 (Option A), #3 (Option A), #5, #6, #9, and #13 would resolve all documentation inconsistencies and can be completed in **under 3 hours** of editing. The code would remain unchanged, but the documentation would accurately reflect what was built.

---

## Conclusion

The FUD Examination Timetable System is a substantial and largely functional piece of software that delivers on its core promise — automating examination scheduling with conflict detection, venue allocation, and invigilator assignment. The main issues identified are not failures of the software itself, but **mismatches between what the documentation says and what the software actually does**. In most cases, the simplest and most appropriate fix is to update the documentation to accurately describe the system that was built, while noting any unimplemented features as recommendations for future work.
