<div align="center">

# 🎭 Official Website of Southeast Cultural Society
### Interactive Web Platform

> An interactive, serverless web platform designed to streamline cultural society operations, event announcements, membership management, creative article publications, and digital identity tracking.

[![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge&logo=render)](https://2022200000149-rantu.github.io/SCS/)
[![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://2022200000149-rantu.github.io/SCS/)
[![Backend](https://img.shields.io/badge/Backend-Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/apps-script)
[![Database](https://img.shields.io/badge/Database-Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets)](https://www.google.com/sheets/about/)

[🌐 **Visit Live Web Portal**](https://2022200000149-rantu.github.io/SCS/) • [🐞 Report Issue](https://github.com/2022200000149-rantu/SCS/issues) • [✨ Request Feature](https://github.com/2022200000149-rantu/SCS/issues)

</div>

---

## 🎓 Academic Information

This project was developed as part of the academic coursework at **Southeast University**.

- **Course Title:** Information System Design & Software Engineering Lab
- **Course Code:** CSE 346.16
- **Department:** Computer Science & Engineering (CSE)
- **Faculty Advisor:** **[SDK] Shimul Dey Katha**, Lecturer, Department of CSE, Southeast University

---

## 👥 Contributors & Development Team

### 🌟 Core Contributors

| Contributor | Student ID | Primary Responsibilities | Profile |
| :--- | :--- | :--- | :---: |
| **Tasfin Apurba** | `2023200000373` | Software Engineering & Frontend/Backend Development | [![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat&logo=github)](https://github.com/apurba200327) |
| **Raihan Mahmud Shaikot** | `2023000000222` | Software Engineering & API Integration | [![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat&logo=github)](https://github.com/raihan0-hub) |
| **Rantu Samadder** | `2022200000149` | Software Engineering, System Architecture & Deployment | [![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat&logo=github)](https://github.com/2022200000149-rantu) |

### 🤝 Guidance & Supervision
Special thanks to **[SDK] Shimul Dey Katha** for continuous technical mentorship and evaluation throughout the software development lifecycle.

---

## 🔗 Live Links

- 🌐 **Official Website:** [Southeast Cultural Society Live](https://2022200000149-rantu.github.io/SCS/)

---

## 📖 Overview

The **Official Website of Southeast Cultural Society** serves as a unified digital platform for managing the society’s cultural events, executive committee, recruitment, photo gallery, and member articles.

Built with a **serverless backend architecture**, the project utilizes **Google Apps Script** as a middleware REST API and **Google Sheets** as a relational database engine. This allows real-time dynamic data rendering on a responsive HTML5/CSS3 frontend without requiring traditional server infrastructure or database hosting fees.

---

## ✨ Key Features

### 🎨 Frontend & User Interface
- **Dynamic HTML5 Canvas Particle Background:** Ambient visual background with interactive particle physics.
- **News Ticker Wheel:** Live ticker bar pulling active notices and announcements dynamically.
- **Dual Infinite Auto-scrolling Gallery:** Seamless horizontal scrolling gallery combining local images (`gallery.json`) and live uploaded images from Google Sheets, complete with a full-screen modal viewer.
- **Responsive Theme:** Custom CSS tokens, oxblood/brass gold cultural aesthetics, and mobile-responsive layout.

### 👥 Membership & Verification
- **Online Application System:** Students can apply for membership with auto-generated timestamps.
- **Real-time Status Check:** Applicants can query their application status (`Pending`, `Approved`, `Rejected`) using their Student ID.
- **Digital ID Allocation:** Approved members automatically receive a formatted Digital ID (e.g., `SCS-2026-0002`).
- **Approved Member Directory:** Filterable registry displaying official society members.

### 🔐 Auth & Role-Based Access Control (RBAC)
- **Unified Login Portal:** Single login form handling both Admin and Member credentials.
- **Token-Based Cache Authentication:** Uses Google Apps Script `CacheService` with UUID session tokens (6-hour TTL).
- **Member Dashboard:** Approved members can submit, edit, and delete their own published or pending articles.
- **Admin Dashboard:** Executive panel with tabbed navigation to manage Notices, Memberships, Committee Members, Gallery Photos, and Article Approvals.

---

## 🛠 Tech Stack

| Domain | Tech / Tool | Usage |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Core web layout, interactivity, and design |
| **Animations** | HTML5 Canvas API | Dynamic floating particle background |
| **Backend / API** | Google Apps Script (GAS) | Serverless REST-like JSON API endpoints (`doGet`, `doPost`) |
| **Database** | Google Sheets | Cloud spreadsheet serving as a relational database |
| **Session Cache** | GAS `CacheService` | Server-side token storage for session authentication |
| **Hosting** | GitHub Pages | Static frontend hosting |

---

## 📊 Database Schema (Google Sheets)

| Sheet Name | Schema / Fields | Description |
| :--- | :--- | :--- |
| `Admin` | `Username`, `Password`, `Name` | Administrative login credentials |
| `Membership` | `ID`, `Name`, `Email`, `Phone`, `Department`, `StudentID`, `ApplicationDate`, `Status`, `DigitalID`, `Password` | Membership applications & status records |
| `Committee` | `ID`, `Name`, `Position`, `Email`, `ImageURL`, `Task` | Executive committee members and assigned tasks |
| `Gallery` | `ID`, `EventTitle`, `ImageURL`, `UploadDate` | Event photos dynamic registry |
| `Articles` | `ID`, `Title`, `Content`, `AuthorName`, `AuthorEmail`, `SubmissionDate`, `Status` | Student articles submitted for review |
| `Notices` | `ID`, `Headline`, `Details`, `RegistrationLink`, `Date` | Public notices and event links |
## 🤝 Contributors

Thanks to all the people who contribute to this project!

<a href="https://github.com/2022200000149-rantu/SCS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=2022200000149-rantu/SCS" alt="Contributors" />
</a>
