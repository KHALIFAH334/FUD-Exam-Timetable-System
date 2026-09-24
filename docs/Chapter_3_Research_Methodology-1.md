## RESEARCH METHODOLOGY CHAPTER THREE

This chapter presents the methodology adopted in the design and development of the Intelligent Automated Examination Timetable Scheduling and Management System for Universities, using Federal University Dutse (FUD) as the case study. It describes the research design, the sources and methods of data collection, the study of the existing examination timetabling process at FUD, the problems identified in that process, the justification for the proposed system, the system development methodology adopted, the functional and non-functional requirements of the proposed system, the system design tools employed, and the hardware and

software requirements needed to implement the system.

- 3.2 Research Design

This study adopts a descriptive research design combined with a system development (design science) approach. The descriptive component involves investigating and documenting how examination timetables are currently generated and managed at Federal University Dutse, while the design science component involves the actual analysis, design, and development of a software artefact intended to solve the identified problems. This combination allows the researcher to ground the proposed system in the real operational context of the university's examination office while following established software engineering practice in building the

solution.

- 3.3 Sources and Method of Data Collection

Data for this study was gathered from both primary and secondary sources to ensure that the analysis of the existing system and the requirements of the proposed system are grounded in

verifiable evidence.

- 3.3.1 Primary Sources

- Interviews: A semi-structured interview was conducted with the Examination Officer of the Faculty of Computing, Malam Ahmad (Malam Ahmad, 2026, personal communication), to understand the current process of collecting course data,

- 3.1 Introduction


- allocating venues and invigilators, resolving scheduling conflicts, and to identify the constraints the proposed system must enforce.

- Departmental Exam Coordinators: Informal consultation with departmental exam coordinators to capture department-specific issues, particularly around combined and elective courses offered across departments, which are a common source of clashes not always visible at the central Examination Office level.

- Questionnaires: A structured questionnaire administered to a sample of students to capture recurring complaints about the existing manual system, such as clashing examinations, inconvenient venue allocation, and delays in accessing the published timetable. Student responses provide a user-side perspective that complements the administrative view obtained from the Examination Office.

- Observation: Direct observation of the manual/semi-manual process used during past examination periods, including how timetable drafts are produced, circulated, and revised, where feasible.

- 3.3.2 Secondary Sources

- Existing FUD examination timetable documents from previous semesters, obtained through the Examination Office.

- Course registration records and venue capacity data, also obtained through the Examination Office, which determine which courses require examination slots and how many candidates each venue can accommodate.

- University academic calendars and any written policy documents on examination scheduling and invigilation, similarly sourced from the Examination Office.

- Academic journals, conference papers, and textbooks on automated timetabling, constraint satisfaction problems, and university scheduling systems, obtained independently through literature search.

- 3.4 Study of the Existing System

An interview was conducted with Malam Ahmad, the Examination Officer of the Faculty of Computing at Federal University Dutse (Malam Ahmad, 2026, personal communication), to establish, first-hand, how the faculty's examination timetable is currently produced. Federal University Dutse comprises nine faculties, each of which independently produces its own examination timetable; the Faculty of Computing was selected as the specific case examined


for this study, and the findings below reflect that interview together with a review of the faculty's actual past timetable documents.

The current process is entirely manual, carried out using Microsoft Excel. At the start of each semester, Heads of Department (HODs) supply the Examination Officer with the list of registered students and the number of courses offered by each department. The Examination Officer then manually assigns dates, time slots, and venues to each course. Producing the complete timetable, from data collection to final publication, takes approximately one week of dedicated effort.

A review of the faculty's own First Semester 2025/2026 examination timetable documents shows that examinations are held across nine distinct venues in regular rotation, namely NEW TT1, CSC LAB 1, CSC Lecture Room 1, CSC Lecture Room 2, CSC Lecture Room 3, NFC Lecture Room 1, NFC Lecture Room 2, Theatre One (CYB LR1 & 2), NCC, and CBT, together with two ELearning halls used for combined multi-course sittings. Invigilators are assigned on a rotational basis, with each invigilator required to invigilate three times per semester across approximately 55 invigilators within the faculty, broken down by department as follows: Computer Science (28), Cyber Security/BI-related courses (21), and Software Engineering (6).

Several scheduling rules are strictly enforced. No student may be scheduled to sit two examinations in the same venue at the same time, and hall capacity limits must never be exceeded. Public holidays falling within the examination period are avoided entirely — for instance, the reviewed timetable explicitly excludes 1st May 2026 as Workers' Day. Students with combined, carry-over, or spill-over course loads are handled by scheduling their affected papers at a different time but on the same date as the main cohort, to keep the process fair without creating a full duplicate schedule. General Studies (GST) courses are scheduled separately from departmental courses, using their own designated time slots within the same document.

Where combined or elective courses span more than one department, Malam Ahmad separates carry-over and spill-over students and fixes them into a different time slot on the same date, rather than a different date entirely, as a practical compromise between fairness and simplicity of preparation.

Once a draft timetable is produced, clashes and errors are identified through manual cross- checking by the Examination Office and through complaints reported by class representatives. Where a clash or venue-allocation problem is found, the timetable is corrected by re-adjusting

the schedule around whatever space and time slots remain available. This cycle is clearly


visible in the faculty's own documentation: the First Semester 2025/2026 examination timetable went through at least four labelled revisions in little over a week — a Revised-Final Draft (19th April 2026), a 3rd Revised-Final Draft (22nd April 2026), a 4th Revised-Final Draft (24th April 2026), and a 5th Revised-Final Draft (27th April 2026) — with individual courses, venues, and invigilator assignments changing between each version. According to Malam Ahmad, automating this process would bring considerable improvement, since it would make the timetable far easier to manage and produce (Malam Ahmad, 2026, personal

communication).

- 3.5 Problems of the Existing System

Based on the investigation of the existing process in the Faculty of Computing, including direct

review of its past examination timetable documents, the following problems were identified:

- 1. Scheduling conflicts: Students offering multiple courses, particularly combined, carry-over, or spill-over courses across departments, occasionally encounter overlapping examination time slots, and resolving this manually depends on the Examination Officer's own cross-checking rather than a systematic check.

- 2. Venue allocation inefficiency: With at least nine distinct venues of varying type and capacity in regular use, matching each course to a suitable venue based on registered candidate numbers is a recurring manual balancing act, and mismatches occasionally occur, particularly where several courses must share combined venues such as the ELearning halls.

- 3. Time-consuming manual process: Producing the complete timetable from HOD submissions to final publication takes a full week of dedicated staff effort using Microsoft Excel, with no automated conflict checking along the way.

- 4. Repeated manual revision cycles: The faculty's own past timetable documents show the same semester's timetable being revised at least four times within roughly a week (19th, 22nd, 24th, and 27th April 2026 alone), with courses, venues, and invigilators being reshuffled between each version — direct evidence of how much rework the manual process currently demands.

- 5. Manual invigilator rotation tracking: Ensuring that each of the faculty's approximately 55 invigilators invigilates exactly three times per semester is tracked manually, which becomes harder to guarantee as the process scales.


- 6. Reactive clash detection: Clashes are currently discovered mainly through manual cross-checks and complaints from class representatives after a draft is circulated, rather than being prevented systematically before publication.

- 7. Lack of a central accessible platform: Timetables are shared as static Excel, PDF, or printed documents rather than through a searchable, continuously updated digital timetable.

- 8. Siloed, faculty-specific processes: Since each of FUD's nine faculties produces its own timetable independently, there is no shared system or tooling that would let a faculty benefit from improvements made elsewhere, and each faculty must currently build its own manual process from scratch.

## 3.6 Justification for the Proposed System

The problems identified above justify the development of an intelligent, automated examination timetable scheduling and management system for Federal University Dutse. An automated system can apply defined scheduling constraints — such as no student having two examinations at the same time, no venue being double-booked, and no invigilator being assigned to two venues simultaneously — consistently and at a speed that manual methods cannot match. This reduces the incidence of clashes, shortens the time required to produce a usable timetable, allows conflicts to be detected and resolved before publication rather than after, and provides a single, continuously accessible source of truth for class representatives, lecturers, and administrative staff, alongside a structured channel for reporting discrepancies

back to the Examination Office.

- 3.7 System Development Methodology

The proposed system is developed using the Object-Oriented Analysis and Design Methodology (OOADM). OOADM was chosen because it models the system as a set of interacting objects (such as Student, Course, Venue, Invigilator, and TimetableEntry) with well-defined attributes and behaviours, which maps naturally onto the entities involved in examination scheduling. OOADM also supports the use of Unified Modelling Language (UML) diagrams — including use case diagrams, entity-relationship diagrams, activity diagrams, and system architecture diagrams — which have already been produced for this project to represent the structure and behaviour of the proposed system.

OOADM proceeds through the following stages, each of which is applied in this project:


- 1. Object-Oriented Analysis (OOA): Identifying the key entities in the examination scheduling domain (students, courses, departments, venues, invigilators, timetable entries) and their relationships, as captured in the entity-relationship diagram.

- 2. Object-Oriented Design (OOD): Translating the analysis into a system architecture, defining classes, their attributes and methods, and how modules such as course management, venue management, conflict detection, and timetable generation interact, as captured in the system architecture diagram.

- 3. Modelling System Behaviour: Representing how users (exam officers, department coordinators, class representatives, lecturers) interact with the system through use case diagrams, and how processes such as timetable generation and conflict resolution flow through the system via activity diagrams.

- 4. Implementation: Translating the design into working software using the chosen technology stack.

- 5. Testing: Verifying that the implemented system correctly enforces scheduling constraints and produces a conflict-free timetable.

An incremental development approach is followed within OOADM, meaning core modules (such as course and venue data management) are built and tested first, followed by the scheduling and conflict-detection engine, and finally the reporting and publication features. This allows early modules to be validated before more complex scheduling logic is layered on top of them.

- 3.7.1 Scheduling Algorithm: Constraint Satisfaction Approach

The core scheduling engine is designed around a Constraint Satisfaction Problem (CSP) formulation. As established in the literature reviewed in Chapter Two, the University Examination Timetabling Problem is an NP-hard combinatorial optimisation problem for which exact methods do not scale well, and constraint-based approaches provide a practical and well-established way of tackling it within a limited development timeframe. In this formulation, each examination is treated as a variable to be assigned a value drawn from the domain of available time slots and venues. Hard constraints define what makes an assignment valid — for example, that no student is scheduled for two examinations at the same time, that no venue's seating capacity is exceeded, and that no invigilator is assigned to two venues simultaneously — and the system is required to satisfy all hard constraints before a generated timetable is considered feasible. Soft constraints, such as spreading a student's examinations evenly across the examination period and avoiding back-to-back papers, are treated as


preferences that the scheduling engine attempts to satisfy as far as possible without being required to.

The scheduling engine applies a backtracking search with constraint propagation (including forward checking) to build up a feasible timetable incrementally: examinations are ordered for placement using a most-constrained-first heuristic (prioritising courses with the largest number of registered students or the most potential clashes), and if an assignment leads to a dead end, the search backtracks and tries an alternative time slot or venue. This approach was chosen over metaheuristic techniques such as genetic algorithms, which are also documented in the literature as effective for this problem, because a CSP-based approach guarantees that all hard constraints are respected in the generated timetable and is more straightforward to implement,

verify, and test within the scope and timeframe of this project.

- 3.8 Requirements of the Proposed System

- 3.8.1 Functional Requirements

The proposed system shall:

- Allow authorised exam officers from any of FUD's faculties to independently input and manage their own course, department, venue, and invigilator data, so that each faculty can generate a timetable based solely on the data it provides, without

- depending on another faculty's records. • Automatically generate an examination timetable based on registered courses,

- available venues, and defined constraints, for the faculty whose data was supplied. Detect and flag scheduling conflicts, including student course clashes, venue double- booking, and invigilator double-booking. Allow manual override and adjustment of automatically generated schedules by authorised staff, with re-validation against constraints.

- Allocate venues based on registered candidate numbers and venue capacity. • Handle combined, carry-over, and spill-over students by scheduling their affected papers at a different time slot on the same date as the main cohort, consistent with current Examination Office practice.


- Track invigilator rotation to ensure each invigilator is assigned a fair, policy- consistent number of duties per semester (e.g. three duties per invigilator, as currently practised).

- Allow public holidays and other blackout dates to be configured and automatically excluded from scheduling.

- Allow class representatives and course lecturers to search and view the published examination timetable by course, department, level, or date.

- Provide a role-based portal through which class representatives and course lecturers can submit complaints or flag discrepancies (such as an apparent clash or an incorrect venue) directly to examination officers, and track the status of a submitted complaint.

- Notify examination officers of newly submitted complaints and allow them to respond to or resolve each complaint within the system.

- Generate printable and exportable timetable reports in multiple formats, including PDF, Excel, and a print-ready notice format, consistent with the Examination Office's stated output preferences.

- Maintain an audit trail of changes made to the timetable after initial generation.

- Support role-based access control distinguishing exam officers (scoped to their own faculty's data), departmental coordinators, and general users (class representatives and lecturers).

- 3.8.2 Non-Functional Requirements

- Usability: The system shall provide a simple, intuitive interface usable by administrative staff without specialised technical training.

- Performance: The system shall generate a full timetable for a semester's examinations within an acceptable processing time (target: under a few minutes for typical FUD course volumes).

- Reliability: The system shall consistently produce conflict-free timetables given valid input data and constraints.

- Security: Access to scheduling and administrative functions shall be restricted through authentication and role-based authorisation.

- Scalability: The system shall accommodate growth in the number of students, courses, and venues without a redesign of its core architecture.


- Maintainability: The system shall be modular, allowing scheduling rules or constraints to be updated as institutional policy changes.

## 3.9 System Design Tools

In line with the Object-Oriented Analysis and Design Methodology adopted, the following UML-based design tools were used to model the proposed system, and are presented in the corresponding sections of this project:

- System Architecture Diagram — depicting the overall structure of the system and how its modules interact.

- Use Case Diagram — depicting the interactions between system actors (Exam Officer, Departmental Coordinator, Class Representative/Lecturer) and system functions, including timetable viewing and complaint submission.

- Entity-Relationship (ER) Diagram — depicting the data entities (Student, Course, Department, Venue, Invigilator, Timetable) and their relationships within the underlying database.

- Activity Diagram — depicting the workflow of key processes, particularly automated timetable generation and conflict resolution.

## 3.10 Hardware and Software Requirements

The development and deployment of the proposed system require the following hardware and software resources:

| Category | Specification |
| --- | --- |
| Processor | Intel Core i5 (or equivalent) and above |
| RAM | Minimum of 8GB |
| Storage | Minimum of 256GB SSD |
| Operating System | Windows 10/11, macOS, or Linux |
| Front-end Technology | HTML5, CSS3, JavaScript, React.js |
| Back-end Technology | Node.js / PHP (Laravel) with RESTful API architecture |


| Database | MySQL |
| --- | --- |
| Development Tools | Visual Studio Code, XAMPP/WAMP, Git & GitHub, Draw.io / |
|   | Lucidchart |
| Browser | Google Chrome, Mozilla Firefox, Microsoft Edge (latest |
|   | versions) |

## 3.11 Summary

This chapter has presented the methodology adopted for this study, combining a descriptive investigation of the existing examination timetabling process at Federal University Dutse with an Object-Oriented Analysis and Design Methodology (OOADM) approach to developing the proposed system. It has documented the sources and methods of data collection, examined the existing manual process and its shortcomings, justified the need for automation, outlined the functional and non-functional requirements of the proposed system, identified the UML design tools used to model it, and specified the hardware and software requirements for its development. The next chapter presents the system design in detail, including the architecture, database design, and interface design of the proposed system.
