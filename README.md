# STC-Toolkit

**Network Topology Analysis Tool for Enterprise Networks**

STC-Toolkit is a powerful desktop application designed to analyze network device configuration files and visualize network topology in a structured, easy-to-understand format. It processes command outputs from network devices (primarily Huawei equipment) and provides comprehensive insights into your network infrastructure.

![Version](https://img.shields.io/badge/version-1.0.5-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Quick Start Guide](#quick-start-guide)
- [User Manual](#user-manual)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- **Device Inventory Management**: Comprehensive view of all network devices with detailed hardware, software, and interface information
- **Interactive Network Topology**: Visual representation of network connections based on LLDP data
- **Time-Series Analytics**: Track device metrics over time with multiple snapshots
- **AI-Powered Analysis**: Built-in AI agent (Ruslan4ick 1.0) for intelligent network analysis
- **Alarm Aggregation**: Centralized view of all device alarms and alerts
- **Excel Reporting**: Generate detailed reports in Excel format
- **Snapshot Management**: Create and compare network state snapshots
- **Offline Mode**: Full functionality without internet connection
- **Data Backup & Restore**: Protect your analysis data

---

## 💻 System Requirements

- **Operating System**: Windows 10/11 (64-bit), macOS 10.13+, or Linux (64-bit)
- **RAM**: Minimum 4 GB (8 GB recommended)
- **Disk Space**: 500 MB for application + space for database and snapshots
- **Node.js**: Version 18+ (only for building from source)
- **npm**: Version 8+ (only for building from source)

---

## 🚀 Installation

### Option 1: Pre-built Executable (Recommended)

1. Download the latest release for Windows: `STC-Toolkit-1.0.4-win-x64.exe`

2. Run the installer and follow the on-screen instructions

3. Launch **STC-Toolkit** from your applications menu

### Option 2: Build from Source

For developers or advanced users who want to customize the application:

```bash
# Clone the repository
git clone <repository-url>
cd stc-2025

# Install dependencies
npm install

# Install and rebuild native modules for Electron
npm install --save-dev electron-rebuild
npx electron-rebuild

# Build the backend
npm run build:main

# Build the frontend
npm run build:renderer

# Start the application
npm start
```

**Development Mode** (with hot-reload):

```bash
npm run dev
```

---

## 🎯 Quick Start Guide

### Step 1: Prepare Your Configuration Files

STC-Toolkit **does not connect directly to network devices**. Instead, it analyzes text files containing command outputs that you collect manually from your network equipment.

**Folder Structure Requirements:**

1. Create a main project folder (e.g., `My_Network`)
2. Inside, create a separate subfolder for each device (folder name should match the device hostname)
3. Place text files (`.txt` or `.log`) with command outputs in each device folder

**Example:**

```
My_Network/
├── Core-SW-01/
│   ├── CommonCollectResult.txt
│   ├── display_interface_brief.txt
│   ├── display_lldp_neighbor_brief.txt
│   └── display_version.txt
│
├── Edge-RTR-02/
│   └── device_config.txt
│
└── Distribution-SW-03/
    └── ...
```

> **💡 Tip**: You can organize outputs in a single file per device or split them into multiple files. The parser automatically extracts information from standard Huawei/H3C command outputs (display version, display interface, display lldp, etc.).

### Step 2: Create a Snapshot

1. Launch **STC-Toolkit**
2. Navigate to the **Dashboard** tab
3. Click **Search file** button
4. Select your main project folder (e.g., `My_Network`)
5. The application will analyze all subfolders and create a snapshot
6. Wait for the success message with the snapshot ID

### Step 3: Explore Your Network

- Visit the **Devices** tab to view detailed device information
- Check the **Network Map** tab to see the topology visualization
- Use **Analytics** to track metrics over time (requires multiple snapshots)
- Generate **Reports** for documentation and auditing

---

## 📖 User Manual

### Dashboard

The main entry point for creating snapshots and viewing recent activity.

- **Create Snapshot**: Import new network configuration data
- **Recent Snapshots**: Quick access to recently created snapshots
- **Statistics Overview**: Summary of devices, interfaces, and alarms

**Best Practices for Snapshots:**
- Create snapshots regularly (daily, weekly, or before/after major changes)
- Use consistent folder structures across snapshots
- Keep device names consistent for accurate time-series analysis

---

### Devices

Detailed information about each network device in the selected snapshot.

**Main Interface:**
- **Snapshot Selector**: Choose which snapshot to analyze
- **Device List**: Filterable list of all devices (search by hostname)
- **Device Details**: Multi-tab view with comprehensive information

**Available Tabs:**

1. **Summary** - Device model, uptime, CPU/memory usage, STP status, licenses
2. **Hardware** - Component inventory (boards, PSUs, fans) with status
3. **Ports** - Interface list with status, IP addresses, transceiver info, optical power
4. **Routing** - IP routing table and ARP entries
5. **Protocols** - BGP, OSPF, IS-IS peer status and BFD sessions
6. **VPN / Tunnels** - VRF instances and MPLS L2VC information

---

### Network Map (Topology)

Interactive visualization of physical network connections.

**How it works:**
- Automatically built from LLDP neighbor data
- Each device is represented as a **node**
- Physical connections are shown as **edges** (links)

**Interactivity:**
- **Drag nodes** to rearrange the layout
- **Zoom** with mouse wheel
- **Click nodes** to see device information
- **Hover over edges** to see link details

> **⚠️ Important**: The topology requires LLDP data from **all** connected devices. Missing devices will result in incomplete topology maps.

---

### AI Agent: Ruslan4ick 1.0

An intelligent assistant powered by large language models to analyze your network data.

**Setup:**
1. Go to **Settings**
2. Enter your **AI Model API Key** (currently supports Google Gemini)
3. Enable **Online Mode**
4. Save settings

**Example queries:**
- "Which devices have the highest CPU usage?"
- "Show me all critical alarms"
- "List BGP peers that are not in Established state"
- "Which interfaces have optical power issues?"

---

### Analytics

Time-series visualization of device metrics across multiple snapshots.

**Available Metrics:**
- System CPU Usage
- Free Storage
- Interface Status (Up/Down)
- Transceiver Rx/Tx Power
- Critical Alarms Count
- Total ARP Entries
- Up BFD Sessions
- Established BGP Peers (IPv4/IPv6)

> **Note**: Requires **at least 2 snapshots** of the same device.

---

### Alerts

Centralized view of all alarms collected from devices with severity-based filtering (Critical, Major, Warning, Info).

---

### Reports

Generate comprehensive Excel reports for documentation and auditing.

**Available Reports:**
- Hardware Inventory
- Transceiver Inventory
- Software & License Audit
- Full ARP/MAC Table
- Network Health Summary
- Unused/Down Ports Report
- Flat Interface & Neighbor Report
- Interface Status (Per Device)
- IP Route Table (Per Device)
- IGP Details Report

---

### Settings

Global application configuration for network mode, AI settings, and data management.

**Network Mode:**
- **Online**: Enables cloud features and AI agent (requires internet)
- **Offline**: Full local operation without external connectivity

**Data Management:**
- **Backup Data**: Create a complete backup of your database
- **Load Backup**: Restore from a previous backup (⚠️ overwrites current data)
- **Clear Data**: Delete all data from the application (⚠️ irreversible)

---

## 🧪 Testing

### Unit Tests

The project uses **Jest** as the testing framework for unit tests. Tests are located in the `tests/` directory and cover critical business logic components.

**Test Coverage:**
- Export Service Report Providers
- Data formatting and transformation logic
- Repository interactions

**Running Tests:**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test HardwareInventoryReportProvider.test.ts
```

**Test Structure:**

```
tests/
├── setupJest.ts                              # Jest configuration
└── services/
    └── export/
        └── providers/
            ├── ArpReportProvider.test.ts
            ├── DownPortsReportProvider.test.ts
            ├── GeneralReportProvider.test.ts
            ├── HardwareInventoryReportProvider.test.ts
            ├── IgpReportProvider.test.ts
            ├── IpRoutePerDeviceReportProvider.test.ts
            ├── NetworkHealthReportProvider.test.ts
            ├── PerDeviceInterfaceReportProvider.test.ts
            ├── SoftwareLicenseReportProvider.test.ts
            └── TransceiverInventoryReportProvider.test.ts
```

**Writing New Tests:**

When adding new features, follow these guidelines:

1. Create test files with `.test.ts` extension
2. Use descriptive test names: `describe()` for test suites, `it()` for individual tests
3. Mock external dependencies using Jest mocks
4. Test both success and error scenarios

**Example Test:**

```typescript
import { MyService } from '../services/MyService';

describe('MyService', () => {
    let service: MyService;
    
    beforeEach(() => {
        service = new MyService();
    });
    
    it('should return correct data', async () => {
        const result = await service.getData(1);
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
    });
    
    it('should handle errors gracefully', async () => {
        await expect(service.getData(-1)).rejects.toThrow();
    });
});
```

**Best Practices:**
- Keep tests isolated and independent
- Use `beforeEach()` for test setup to ensure clean state
- Mock database and external API calls
- Aim for high test coverage on business logic
- Run tests before committing changes

---

## 📁 Project Structure

```
stc-2025/
├── backend/                      # Backend (Electron main process)
│   └── src/
│       ├── container.ts          # Dependency injection container
│       ├── types.ts              # Type definitions
│       ├── database/
│       │   └── data-source.ts    # TypeORM data source configuration
│       ├── handlers/             # IPC handlers for Electron
│       ├── migrations/           # Database migrations
│       ├── models/               # TypeORM entity models
│       ├── repositories/         # Data access layer
│       └── services/             # Business logic layer
│
├── renderer/                     # Frontend (React + Vite)
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.tsx               # Main React component
│       ├── main.tsx              # React entry point
│       ├── index.css             # Global styles (Tailwind)
│       ├── api/                  # IPC communication with backend
│       ├── components/           # React components
│       ├── hooks/                # Custom React hooks
│       ├── icons/                # Icon components
│       └── utils/                # Utility functions
│
├── scripts/                      # Build scripts
├── dist/                         # Compiled output (generated)
├── index.ts                      # Electron main entry point
├── preload.js                    # Electron preload script
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── postcss.config.js             # PostCSS configuration
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start in development mode with hot-reload

# Building
npm run build:main             # Compile backend (TypeScript)
npm run build:renderer         # Build frontend (Vite)
npm run build                  # Full build (backend + renderer + electron)

# Running
npm start                      # Start in production mode

# Database migrations
npm run typeorm                # Run TypeORM CLI
npm run migration:create       # Create a new migration
npm run migration:generate     # Generate migration from entity changes
npm run migration:run          # Run pending migrations
npm run migration:revert       # Revert last migration

# Packaging
npm run pack:win               # Package for Windows
npm run pack:mac               # Package for macOS
npm run pack:linux             # Package for Linux
npm run build:portable         # Build portable Windows executable
```

### Technology Stack

**Frontend:**
- React 18.3 + TypeScript 5.9
- Vite 5.4
- Tailwind CSS 3.4
- Recharts (charts/graphs)
- React Graph Vis (network topology)

**Backend:**
- Electron 38
- Node.js + TypeScript
- TypeORM 0.3.27
- Better-SQLite3 (database)
- InversifyJS (dependency injection)
- Express (API server)

**Additional:**
- Google Cloud BigQuery (cloud analytics)
- XLSX (Excel report generation)

### Adding New Features

1. **Backend Handler**: Create a new handler in `backend/src/handlers/`
2. **IPC Channel**: Register the handler in `container.ts`
3. **Frontend API**: Add API function in `renderer/src/api/`
4. **React Component**: Create UI in `renderer/src/components/`

### Database Schema Changes

```bash
# Generate migration from entity changes
npm run migration:generate -- ./backend/src/migrations/MyMigration

# Run the migration
npm run migration:run
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Migration Error: "duplicate column name"

**Problem**: Database schema is out of sync with migrations.

**Solution**: Reset the database by deleting the database file located at `%APPDATA%/stc-toolkit/database.sqlite` (Windows) or using **Settings → Clear Data** in the application, then restart.

#### 2. "No handler registered" Error

**Problem**: IPC communication between frontend and backend is broken.

**Solution**: 
- Rebuild the application: `npm run build:main && npm run build:renderer`
- Restart the application
- Check that all handlers are properly registered in `container.ts`

#### 3. Topology Not Displaying

**Problem**: Missing LLDP data or incomplete snapshot.

**Solution**:
- Ensure all devices have LLDP neighbor information in their outputs
- Verify device folder names match device hostnames
- Check that LLDP is enabled on physical connections

#### 4. AI Agent Not Working

**Problem**: API key not configured or invalid.

**Solution**:
- Go to **Settings** → Enter a valid Google Gemini API key → Enable "Online Mode" → Save settings

#### 5. Performance Issues with Large Snapshots

**Problem**: Slow performance with many devices.

**Solution**:
- Use filters to narrow down device lists
- Close unused tabs
- Consider splitting large networks into multiple projects

### Getting Help

If you encounter issues not covered here:

1. Check the application logs (stored in `%APPDATA%/stc-toolkit/logs`)
2. Review the console output when running in development mode
3. Create a backup before attempting fixes
4. Open an issue in the project repository

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use ESLint for code linting
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://react.dev/)
- Network visualization using [vis-network](https://visjs.org/)
- Charts by [Recharts](https://recharts.org/)

---

## 📞 Support

For questions, issues, or feature requests, please open an issue in the project repository.

---

**Made with ❤️ for Network Engineers and Huawei**
