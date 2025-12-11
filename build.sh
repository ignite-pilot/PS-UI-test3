#!/bin/bash
# Build script to build frontend and prepare for unified service

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Frontend build completed!"
echo "Now you can run the backend server and it will serve both API and frontend:"
echo "  cd backend && python run.py"
echo ""
echo "The application will be available at http://localhost:8601"
