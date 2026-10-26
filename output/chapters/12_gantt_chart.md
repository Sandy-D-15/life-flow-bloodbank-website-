# CHAPTER 12: GANTT CHART & PROJECT TIMELINE

## 12.1 Project Lifecycle & Execution Timeline

The development of the LifeFlow Blood Bank Management System followed a structured, phased software engineering lifecycle spanning a rigorous ten-week timeframe from **August 2026 through October 2026** (Academic Calendar Weeks 32 to 41). To ensure disciplined project velocity, the lifecycle was organized into discrete, sequential work packages covering requirements elicitation, architectural PlantUML modeling, database schema implementation, frontend component synthesis, security hardening, automated API testing, and final academic documentation.

Figure 12.1 reproduces the authoritative project Gantt chart extracted directly from Page 20 of the system design specification (`LifeFlow-Blood-Bank-Diagrams.pdf`), rasterized at 200 DPI with header and footer bands cleanly cropped.

![Figure 12.1: LifeFlow Project Gantt Chart](diagrams_native/img-019.png)

---

## 12.2 Reconstructed Project Schedule & Milestone Breakdown

Table 12.1 provides the reconstructed project schedule corresponding to the timeline bars depicted in the authoritative Gantt chart above. Note that calendar dates represent working day bounds corresponding to the weekly intervals (Weeks 32 to 41) mapped in the PlantUML specification.

### Table 12.1: LifeFlow Project Work Breakdown Schedule

| Phase / Task Name | Calendar Start Date | Calendar End Date | Duration (Weeks / Days) | Core Engineering Deliverables & Milestone Focus |
|---|---|---|---|---|
| **1. Requirement Gathering** | August 3, 2026 (W32) | August 21, 2026 (W34) | 3 Weeks (15 Days) | Clinical stakeholder interviews, WHO/NBTC interval analysis, FR/NFR specification compilation. |
| **2. Feasibility Study** | August 10, 2026 (W33) | August 21, 2026 (W34) | 2 Weeks (10 Days) | Technical, economic (₹0 FOSS), operational, and schedule feasibility assessment. |
| **3. System Analysis** | August 10, 2026 (W33) | September 4, 2026 (W36) | 4 Weeks (20 Days) | Critique of existing manual/spreadsheet blood banks, comparative evaluation matrix. |
| **4. UI/UX Design** | August 24, 2026 (W35) | September 11, 2026 (W37) | 3 Weeks (15 Days) | Wireframing, design token selection (deep blood-red `#F0003C`), layout ergonomics. |
| **5. Database Design** | September 7, 2026 (W37) | September 18, 2026 (W38) | 2 Weeks (10 Days) | ER modeling, JSON schema definition, MongoDB Atlas cluster initialization, seed datasets. |
| **6. Backend Development** | September 7, 2026 (W37) | October 2, 2026 (W40) | 4 Weeks (20 Days) | Express REST API server, promise-chain mutex locking (`withTransactionLock`), inventory mutation routes. |
| **7. Frontend Development** | September 14, 2026 (W38) | October 2, 2026 (W40) | 3 Weeks (15 Days) | React 19 SPA, Tailwind CSS v4 components, Chart.js canvas integration, GSAP motion reveals. |
| **8. Admin Authentication** | September 14, 2026 (W38) | September 25, 2026 (W39) | 2 Weeks (10 Days) | PBKDF2 cryptographic password salting (SHA-512), 24-hour Bearer session tokens, logout invalidation. |
| **9. Appointment & Maps Integration**| September 21, 2026 (W39) | October 2, 2026 (W40) | 2 Weeks (10 Days) | Dual-date scheduling, 56-day interval evaluation, Google Maps center geocoding, calendar exports. |
| **10. OTP Verification Architecture**| September 21, 2026 (W39) | October 2, 2026 (W40) | 2 Weeks (10 Days) | Architectural modeling of 6-digit HMAC-SHA256 OTP verification flow (Diagrams 8.13, 8.15). |
| **11. Certificate & QR Architecture**| September 21, 2026 (W39) | October 9, 2026 (W41) | 3 Weeks (15 Days) | Architectural specification of PDFKit certificate generation and public QR verification route (8.18). |
| **12. Email & Notification Setup** | September 28, 2026 (W40) | October 9, 2026 (W41) | 2 Weeks (10 Days) | Nodemailer SMTP integration, responsive HTML templates, requisition status dispatchers. |
| **13. Testing & Bug Fixing** | September 28, 2026 (W40) | October 9, 2026 (W41) | 2 Weeks (10 Days) | Automated test suite execution (16 API tests), negative boundary condition audits, lint verification. |
| **14. Render Cloud Deployment Setup**| October 5, 2026 (W41) | October 12, 2026 (W41) | 1 Week (5 Days) | Containerized deployment configuration, production esbuild bundling, environment validation. |
| **15. Project Documentation** | September 28, 2026 (W40) | October 14, 2026 (W41) | 2.5 Weeks (12 Days) | Final report compilation, source mapping, diagram commentary, placeholder resolution. |
| **16. Final Review & Submission** | October 12, 2026 (W41) | October 16, 2026 (W41) | 1 Week (5 Days) | Departmental project presentation, practical viva examination, university submission. |

---

## 12.3 Timeline Analysis & Execution Strategy

The critical path of the project traversed the sequential sequence: Requirement Gathering $\rightarrow$ System Analysis $\rightarrow$ Database Design $\rightarrow$ Backend Development $\rightarrow$ Frontend Integration $\rightarrow$ Automated Testing $\rightarrow$ Academic Report Submission. 

Key strategic milestones achieved during this execution lifecycle include:
- **Parallel Work Streams:** Architectural design modeling (PlantUML) progressed in parallel with early UI prototyping during Weeks 35 to 37, minimizing dead-time prior to backend implementation.
- **Test-Driven Milestone Gate:** Core backend routes (`/api/inventory`, `/api/requests`, `/api/donors`) were verified through the automated test suite before final frontend integration, preventing cascading integration bugs.
- **On-Time Milestone Completion:** All sixteen operational tasks were delivered within their designated weekly windows, confirming that the technical scope was realistically sized and executed with disciplined software engineering rigor.
