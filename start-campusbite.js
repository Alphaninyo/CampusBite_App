const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('========================================');
console.log('   CampusBite System Startup Script');
console.log('========================================');
console.log('');
console.log('This script will start:');
console.log('1. PostgreSQL Database (check if running)');
console.log('2. Backend API Server');
console.log('3. Frontend Development Server');
console.log('');
console.log('Please make sure PostgreSQL is installed and running');

// Function to check if a port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const socket = new net.Socket();

        socket.setTimeout(2000);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('error', () => {
            resolve(false);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, 'localhost');
    });
}

// Function to start a process and wait
function startProcess(command, args, cwd, name, port, waitTime = 10000) {
    return new Promise((resolve, reject) => {
        console.log(`\n[${name}] Starting ${name}...`);

        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'pipe',
            shell: true,
            windowsHide: true
        });

        let output = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (data) => {
            output += data.toString();
        });

        process.on('error', (error) => {
            console.error(`❌ Failed to start ${name}:`, error.message);
            reject(error);
        });

        setTimeout(async () => {
            const isRunning = await checkPort(port);
            if (isRunning) {
                console.log(`✅ ${name} is running on port ${port}`);
                resolve(process);
            } else {
                console.error(`❌ ${name} failed to start on port ${port}`);
                console.error('Output:', output);
                reject(new Error(`${name} failed to start`));
            }
        }, waitTime);
    });
}

// Main startup function
async function startCampusBite() {
    try {
        // Check PostgreSQL (port 5432)
        console.log('\n[1/3] Checking PostgreSQL Database...');
        const postgresRunning = await checkPort(5432);
        
        if (!postgresRunning) {
            console.log('❌ PostgreSQL is not running on port 5432');
            console.log('Please start PostgreSQL service manually');
            console.log('');
            console.log('On Windows:');
            console.log('- Open Services (services.msc)');
            console.log('- Find "postgresql-x64-14" (or similar)');
            console.log('- Right-click and select "Start');
            console.log('');
            process.exit(1);
        } else {
            console.log('✅ PostgreSQL is running on port 5432');
        }
        
        // Start Backend (port 5000)
        const backendDir = path.join(__dirname, 'CampusBite_Backend-main', 'CampusBite_Backend-main');
        const backendProcess = await startProcess('npm', ['start'], backendDir, 'Backend Server', 5000, 15000);
        
        // Start Frontend (port 8082)
        const frontendDir = path.join(__dirname, 'CampusBite_App-main', 'CampusBite_App-main');
        const frontendProcess = await startProcess('npx', ['expo', 'start', '--web', '--port', '8082'], frontendDir, 'Frontend Server', 8082, 20000);
        
        // Success message
        console.log('\n========================================');
        console.log('  CampusBite System Started Successfully!');
        console.log('========================================');
        console.log('');
        console.log('🌐 Frontend: http://localhost:8082');
        console.log('🔧 Backend API: http://localhost:5000');
        console.log('🗄️  Database: PostgreSQL (localhost:5432)');
        console.log('');
        console.log('🎯 Test Accounts:');
        console.log('   Consumer: mark@campusbite.com / password123');
        console.log('   Admin: sysadmin@campusbite.com / password123');
        console.log('   Vendor: vendor2@campusbite.com / password123 (needs approval)');
        console.log('   Food Courier: rider@campusbite.com / password123 (needs approval)');
        console.log('');
        
        // Open browser after a short delay
        setTimeout(() => {
            console.log('Opening application in browser...');
            const { spawn } = require('child_process');
            spawn('start', ['http://localhost:8082'], { shell: true });
        }, 2000);
        
        console.log('\n🚀 CampusBite is now running!');
        console.log('Keep this process running to maintain the services.');
        console.log('');
        console.log('To stop all services:');
        console.log('1. Press Ctrl+C in this window');
        console.log('2. Or close this window');
        console.log('');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Shutting down CampusBite system...');
            backendProcess.kill();
            frontendProcess.kill();
            console.log('✅ All services stopped');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('\n❌ Failed to start CampusBite system:', error.message);
        process.exit(1);
    }
}

// Start the system
startCampusBite();
