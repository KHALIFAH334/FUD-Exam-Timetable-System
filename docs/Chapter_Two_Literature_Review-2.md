**CHAPTER TWO**

**LITERATURE REVIEW**

# **2.1 Introduction**

Examination timetabling has attracted a fairly large body of research over the last few decades, partly because the problem is deceptively simple to describe but difficult to solve well at any real scale. This chapter looks at that body of work from three angles. It starts with the conceptual side of things: what the University Examination Timetabling Problem (UETP) actually is, and the constraints that make it hard. It then moves through the algorithmic approaches that different researchers have used to attack the problem, from the earliest graph-colouring formulations to the metaheuristic and hybrid methods that dominate more recent work. Finally, it turns to systems that have actually been built, both within Nigerian universities and elsewhere, to see what they got right and where they fall short. The chapter closes by pulling these threads together and pointing to the specific gap that this project is aimed at.

# **2.2 Conceptual Review**

## **2.2.1 The Concept of Timetabling and Examination Timetabling**

At its most general, timetabling is the problem of assigning a set of events to a limited number of time periods and resources so that a given collection of constraints is respected (Schaerf, 1999). Within a university setting, this splits into two related but distinct problems: course (or lecture) timetabling, which deals with scheduling regular teaching activities, and examination timetabling, which deals with scheduling assessments once a teaching period ends. Of the two, examination timetabling tends to be the more demanding, mainly because it has to account for large numbers of students who are enrolled in overlapping combinations of courses, a fixed and often limited pool of venues, and an examination period that is usually far shorter than the semester it concludes (Qu et al., 2009; Ibrahim, Yusuf and Aliyu, 2023).

More formally, the University Examination Timetabling Problem is the task of assigning a set of examinations to a limited number of time slots and rooms in a way that satisfies a defined set of hard constraints while keeping the violation of soft constraints as low as possible (Qu et al., 2009). The number of possible combinations grows extremely fast as the number of courses, students, and rooms increases, which is why the UETP is classified as an NP-hard combinatorial optimisation problem: there is no known algorithm that can guarantee an optimal solution within a reasonable amount of time once the problem reaches any realistic size (Carter, Laporte and Lee, 1996). This is really the underlying reason manual and spreadsheet-based scheduling, still common at many Nigerian universities including Federal University Dutse, tends to break down as enrolment figures and course combinations grow (Adewole and Eze, 2022).

## **2.2.2 Constraints in Examination Timetabling**

Constraints in this problem are usually split into two categories. Hard constraints are rules a timetable has to satisfy before it can even be called feasible — for example, that no student sits two examinations at once, that a venue's capacity is never exceeded, and that an invigilator is not assigned to two rooms at the same time. Soft constraints are more like preferences: violating them does not make a timetable invalid, but it does make it worse. Spreading a student's examinations evenly across the examination period, avoiding back-to-back exams for the same student, and honouring departmental scheduling preferences all fall into this category (Qu et al., 2009). In practice, a good timetabling system is judged by whether it satisfies every hard constraint while keeping the weighted violation of soft constraints as low as it reasonably can, and that balance is exactly what the scheduling engine in this project is being designed around.

# **2.3 Theoretical and Algorithmic Review of Timetabling Techniques**

Researchers have proposed a fairly wide range of computational techniques for the UETP over the years. Three families come up again and again in the literature: graph-colouring approaches, constraint-based and heuristic approaches, and metaheuristic approaches. Each is discussed in turn below.

## **2.3.1 Graph-Colouring Approaches**

The oldest and arguably still the most influential way of framing the UETP is as a graph-colouring problem. Each examination becomes a vertex; a conflict between two examinations, meaning some student has to sit both, becomes an edge joining the two vertices; and each available time slot becomes a colour. A feasible timetable is then simply an assignment of colours to vertices such that no two connected vertices share a colour (Carter, Laporte and Lee, 1996). Almost all of the algorithmic work that came after, including the constraint-based and metaheuristic methods discussed below, builds on this basic formulation in one way or another. It also explains fairly directly why the UETP is hard in the first place, since colouring a general graph with the fewest possible colours is itself an NP-hard problem.

## **2.3.2 Constraint-Based and Heuristic Approaches**

Constraint-based methods treat the UETP as a constraint satisfaction problem: hard constraints are written as rules that cannot be broken, and a search procedure such as backtracking or forward checking is used to build up a feasible assignment step by step. Duong and Lam (2004) combined constraint programming with simulated annealing for exactly this purpose, using backtracking and forward checking to keep the search effort manageable and a dynamic ordering strategy to decide which examination to place next. That last idea — ordering examinations by how many students they involve or how many conflicts they carry — turns up repeatedly in the literature and still shows up as a component inside more modern hybrid systems (Qu et al., 2009).

## **2.3.3 Metaheuristic Approaches**

Exact methods simply do not scale to problems of realistic size, which is why so much of the recent literature has shifted towards metaheuristics — techniques that give up the guarantee of optimality in exchange for producing good, feasible timetables in a reasonable amount of time. Genetic algorithms (GAs) are probably the most widely applied metaheuristic in this space. Arogundade, Akinwale and Aweda (2010) used a genetic algorithm built around a hierarchy of weighted constraints on a real-world dataset from the University of Agriculture, Abeokuta, showing that both individual requests and institutional requirements could be folded into how candidate timetables were scored. More recently, Akinola and Odeniyi (2024) took this further with a hybrid genetic-and-greedy approach for the Department of Computer Science at the University of Ibadan, where the genetic algorithm generated an initial population of candidate timetables and a greedy activity-selection step then refined them; they reported that the hybrid handled the full constraint set better than either technique on its own.

Tabu search and simulated annealing are two other metaheuristics that come up often in this literature — tabu search keeps a memory of recently visited solutions so the search does not double back on itself, while simulated annealing occasionally accepts a worse solution so it can escape local optima. Both have been paired with genetic algorithms in hybrid schemes that try to get the best of both worlds: the broad exploration GAs are good at, and the fine-tuning that local search methods provide (Qu et al., 2009). Read together, these studies point to a fairly clear trend away from single, exact algorithms and towards hybrid pipelines that lean on more than one technique — an idea that shapes how the scheduling engine for this project is being approached.

# **2.4 Review of Related Systems**

## **2.4.1 Related Systems Developed in Nigerian Universities**

Several Nigerian institutions have already built and documented their own automated timetabling systems. Muhammad, Galadanci, Mustapha and Yahaya (2017) built an Android and web-based timetable customisation system for the Faculty of Computer Science and Information Technology, Bayero University, Kano. The web component gave administrators a module for scheduling and rescheduling lecture, examination, and invigilation timetables, while an accompanying Android app let students and staff view, customise, and get real-time updates on published timetables — replacing the paper and notice-board postings the department had relied on before. Comparable web-based systems have also been reported at the Federal University of Technology, Owerri and at Nnamdi Azikiwe University, Awka, and they tend to follow a similar pattern: a relational database, usually MySQL, paired with a PHP-driven front end, built to tackle the same recurring problems — clashes from students taking cross-departmental or elective courses, the sheer administrative time manual scheduling consumes, and the difficulty of handling late changes to course or venue data.

These Nigerian systems show that automating parts of examination scheduling is clearly workable within the local university context, but most of what has been reported concentrates on generating and publishing the timetable itself, with comparatively little built in for two-way interaction between examination officers and the people who actually use the timetable. Very few of the systems reviewed here give class representatives or lecturers a structured, role-based way to formally flag a problem with a published timetable from within the system itself — and that gap is one of the things the role-based portal in this project is meant to close.

## **2.4.2 Related Systems and Approaches Internationally**

Outside Nigeria, examination timetabling has been the subject of a much larger research effort, a good deal of which has been pulled together in survey papers. Qu et al. (2009) reviewed roughly a decade of exam timetabling research, tracing how the field moved from single-technique approaches towards hybridised search methods, and pointing out that there is still no real consensus on how solution quality should be measured or reported across studies — a criticism that echoes Schaerf's (1999) earlier survey of automated timetabling generally. Benchmark datasets, starting with those introduced by Carter, Laporte and Lee (1996) and later extended through international timetabling competitions, have made it possible to compare different algorithms on common ground, though later work has noted these benchmarks do not always reflect the full range of constraints an institution runs into in practice (Qu et al., 2009).

# **2.5 Summary of Reviewed Literature and Research Gap**

Three things come out of this chapter that matter directly for this project. First, the UETP is a well-established NP-hard problem for which exact methods just do not scale, so heuristic and metaheuristic techniques — increasingly combined into hybrids — are really the only practical basis for building an automated scheduling engine (Carter, Laporte and Lee, 1996; Qu et al., 2009). Second, genetic-algorithm-based and hybrid genetic approaches have already been shown, in studies done within Nigerian universities themselves, to cope with the kind of weighted, institution-specific constraints that a local examination environment throws up (Arogundade, Akinwale and Aweda, 2010; Akinola and Odeniyi, 2024). Third, even though a number of Nigerian institutions have built web-based examination timetabling systems, what has been reported so far leans heavily towards generating and publishing timetables, with little in the way of an integrated, role-based channel for class representatives and lecturers to view timetables and raise complaints or discrepancies back to examination officers (Muhammad et al., 2017).

It is this combination — the limited use of hybrid scheduling engines tuned to local constraints, and the mostly one-directional nature of existing timetable systems — that this study is aimed at. The Intelligent Automated Examination Timetable Scheduling and Management System proposed for Federal University Dutse is intended to bring both pieces together: a constraint-aware scheduling engine on one side, and a role-based portal for transparent communication between examination officers, class representatives, and course lecturers on the other.

**REFERENCES**

Adewole, T. and Eze, C. (2022) 'Challenges of manual examination timetabling in Nigerian universities', Journal of Educational Administration Studies, 8(2), pp. 45-58.

Akinola, S. O. and Odeniyi, L. A. (2024) 'Optimisation of university examination timetable using hybridised genetic and greedy algorithms: a case study of Computer Science Department, University of Ibadan', International Journal of Computer, 52(1), pp. 1-15.

Arogundade, O. T., Akinwale, A. T. and Aweda, O. M. (2010) 'A genetic algorithm approach for a real-world university examination timetabling problem', International Journal of Computer Applications, 12(5), pp. 22-27.

Carter, M. W., Laporte, G. and Lee, S. Y. (1996) 'Examination timetabling: algorithmic strategies and applications', Journal of the Operational Research Society, 47(3), pp. 373-383.

Duong, T. A. and Lam, K. H. (2004) 'Combining constraint programming and simulated annealing on university exam timetabling', in Proceedings of the 2nd International Conference in Computer Science, Ho Chi Minh City, Vietnam.

Ibrahim, M., Yusuf, A. and Aliyu, S. (2023) 'Automated scheduling systems in Nigerian tertiary institutions: prospects and challenges', Nigerian Journal of Computing and Information Systems, 6(1), pp. 12-24.

Muhammad, S., Galadanci, B., Mustapha, A. and Yahaya, A. (2017) 'Design and implementation of an android and web-based university timetable customization system', Bayero Journal of Pure and Applied Sciences, 10(1), pp. 320-325.

Qu, R., Burke, E. K., McCollum, B., Merlot, L. T. G. and Lee, S. Y. (2009) 'A survey of search methodologies and automated system development for examination timetabling', Journal of Scheduling, 12(1), pp. 55-89.

Schaerf, A. (1999) 'A survey of automated timetabling', Artificial Intelligence Review, 13(2), pp. 87-127.
