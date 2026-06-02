**Senior Software Engineer (Full Stack)**

**Take-Home Technical Assignment**

**Assignment Title**

Real-Time Traffic Incident Management Platform

**Objective**

The purpose of this assignment is to evaluate your ability to design and develop a scalable full-stack application while demonstrating architectural thinking, system integration knowledge, performance awareness, and engineering best practices.

This assignment intentionally focuses on architecture, data flow, and scalability considerations rather than UI complexity.

**Scenario**

A traffic management center receives incidents from roadside devices such as cameras, sensors, and intelligent traffic systems.

These incidents must be ingested, processed, stored, and displayed to operators in near real-time.

Example incident:

{

"deviceId": "CAM-001",

"location": "Sheikh Zayed Road",

"eventType": "ACCIDENT",

"severity": "HIGH",

"timestamp": "2026-06-01T10:30:00Z",

"status": "OPEN"

}

The system should support future growth where thousands of devices may continuously generate incident events.

**Functional Requirements**

**Backend**

Develop APIs that support:

**Incident Ingestion**

Create an API endpoint to receive traffic incidents.

**Incident Retrieval**

Provide APIs to:

* Retrieve incidents
* Filter by:
  + Severity
  + Status
  + Device
  + Date range
* Pagination support

**Incident Updates**

Allow incident status updates.

Example statuses:

* OPEN
* ACKNOWLEDGED
* IN\_PROGRESS
* RESOLVED

**Statistics**

Provide summary metrics such as:

* Total incidents
* Incidents by severity
* Open incidents
* Resolved incidents

**Frontend**

Develop a dashboard that provides:

**Incident List**

Display incidents in a table/grid.

**Filters**

Support filtering by:

* Severity
* Status
* Device

**Incident Details**

Allow viewing incident details.

**Dashboard Summary**

Display summary metrics.

**Real-Time Updates (Preferred)**

Display newly received incidents without requiring a manual page refresh.

**Data Simulation**

Create a simple mechanism to generate incident traffic.

Examples:

* Script
* API endpoint
* Seeder

The simulator should be configurable and capable of generating:

* 100 incidents
* 1,000 incidents
* 10,000 incidents

The objective is not load testing but to demonstrate performance awareness.

**Technical Requirements**

Preferred technologies:

Backend:

* Node.js / NestJS
* Java / Spring Boot

Frontend:

* React
* Next.js

Database:

* PostgreSQL
* MongoDB

You may choose alternative technologies if justified.

**Architecture & Engineering Expectations**

We are more interested in engineering decisions than feature count.

Your solution should demonstrate:

* Clean architecture
* Proper separation of concerns
* Meaningful data modelling
* Error handling
* Validation
* Logging
* API design best practices

**Architecture Review Document (Mandatory)**

Provide a short document explaining:

**System Architecture**

Include a high-level architecture diagram.

**Design Decisions**

Explain major design choices.

**Bottlenecks**

Identify potential bottlenecks in your design.

Examples:

* API ingestion bottleneck
* Database write bottleneck
* Database read bottleneck
* WebSocket scalability
* Memory consumption
* Reporting performance

**Scaling Strategy**

Explain how you would scale the solution if:

* Device count increases from 100 to 100,000
* Incident volume increases by 100x

Possible discussion points:

* Queues
* Kafka
* Caching
* Horizontal scaling
* Database partitioning
* Read replicas
* Event-driven architecture

There is no requirement to implement these optimizations.

We are interested in your reasoning.

**Deliverables**

Submit:

1. Source code
2. README
3. Database schema
4. Sample data generator
5. Architecture diagram
6. Architecture review document
7. API documentation

**What We Will Evaluate**

**Technical Design**

* Application structure
* Separation of concerns
* Extensibility

**Backend Engineering**

* API quality
* Data modelling
* Validation
* Error handling

**Frontend Engineering**

* Usability
* Code organization
* State management

**Performance Awareness**

* Understanding of bottlenecks
* Scaling considerations

**Communication**

* Architecture explanation
* Trade-off discussion
* Documentation quality

**Time Expectation**

Expected effort:
8–16 hours

Recommended completion window:
2 calendar days

**Bonus Points (Optional)**

* WebSocket updates
* Redis caching
* Background job processing
* Event-driven architecture proposal
* Automated tests

Good luck, and we look forward to reviewing your solution.