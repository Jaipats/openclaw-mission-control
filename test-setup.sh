#!/bin/bash

# OpenClaw Mission Control - Installation Test Script
# This script tests if everything is set up correctly

echo "======================================"
echo "OpenClaw Mission Control Setup Test"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check Node.js installation
echo "Running tests..."
echo ""
echo "[1/10] Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    test_result 0 "Node.js is installed ($NODE_VERSION)"
else
    test_result 1 "Node.js is not installed"
fi

# Test 2: Check npm installation
echo "[2/10] Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    test_result 0 "npm is installed (v$NPM_VERSION)"
else
    test_result 1 "npm is not installed"
fi

# Test 3: Check if package.json exists
echo "[3/10] Checking package.json..."
if [ -f "package.json" ]; then
    test_result 0 "package.json exists"
else
    test_result 1 "package.json not found"
fi

# Test 4: Check if node_modules exists
echo "[4/10] Checking dependencies..."
if [ -d "node_modules" ]; then
    test_result 0 "Dependencies installed (node_modules found)"
else
    test_result 1 "Dependencies not installed (run: npm install)"
fi

# Test 5: Check backend files
echo "[5/10] Checking backend files..."
BACKEND_FILES=("server/index.js" "server/agentManager.js" "server/traceManager.js" "server/seedDemo.js")
MISSING_BACKEND=0
for file in "${BACKEND_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_BACKEND++))
    fi
done
if [ $MISSING_BACKEND -eq 0 ]; then
    test_result 0 "All backend files present (${#BACKEND_FILES[@]} files)"
else
    test_result 1 "$MISSING_BACKEND backend files missing"
fi

# Test 6: Check frontend files
echo "[6/10] Checking frontend files..."
FRONTEND_FILES=("src/App.jsx" "src/main.jsx" "src/index.css")
MISSING_FRONTEND=0
for file in "${FRONTEND_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_FRONTEND++))
    fi
done
if [ $MISSING_FRONTEND -eq 0 ]; then
    test_result 0 "All frontend core files present"
else
    test_result 1 "$MISSING_FRONTEND frontend files missing"
fi

# Test 7: Check component files
echo "[7/10] Checking React components..."
COMPONENT_FILES=("src/components/Header.jsx" "src/components/AgentTree.jsx" "src/components/TracePanel.jsx" "src/components/StatsPanel.jsx" "src/components/CreateAgentModal.jsx")
MISSING_COMPONENTS=0
for file in "${COMPONENT_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_COMPONENTS++))
    fi
done
if [ $MISSING_COMPONENTS -eq 0 ]; then
    test_result 0 "All React components present (${#COMPONENT_FILES[@]} components)"
else
    test_result 1 "$MISSING_COMPONENTS component files missing"
fi

# Test 8: Check hook files
echo "[8/10] Checking custom hooks..."
HOOK_FILES=("src/hooks/useWebSocket.js" "src/hooks/useAgents.js" "src/hooks/useTraces.js")
MISSING_HOOKS=0
for file in "${HOOK_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_HOOKS++))
    fi
done
if [ $MISSING_HOOKS -eq 0 ]; then
    test_result 0 "All custom hooks present (${#HOOK_FILES[@]} hooks)"
else
    test_result 1 "$MISSING_HOOKS hook files missing"
fi

# Test 9: Check documentation
echo "[9/10] Checking documentation..."
DOC_FILES=("README.md" "GETTING_STARTED.md" "ARCHITECTURE.md" "QUICK_REFERENCE.md")
MISSING_DOCS=0
for file in "${DOC_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_DOCS++))
    fi
done
if [ $MISSING_DOCS -eq 0 ]; then
    test_result 0 "All documentation files present (${#DOC_FILES[@]} files)"
else
    test_result 1 "$MISSING_DOCS documentation files missing"
fi

# Test 10: Check configuration files
echo "[10/10] Checking configuration..."
CONFIG_FILES=("vite.config.js" ".env.example" ".gitignore")
MISSING_CONFIG=0
for file in "${CONFIG_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_CONFIG++))
    fi
done
if [ $MISSING_CONFIG -eq 0 ]; then
    test_result 0 "All configuration files present"
else
    test_result 1 "$MISSING_CONFIG configuration files missing"
fi

# Print summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "🎉 Your OpenClaw Mission Control is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run dev"
    echo "  2. Open: http://localhost:3000"
    echo "  3. (Optional) Run: npm run seed"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    echo ""
    if [ ! -d "node_modules" ]; then
        echo "Tip: Run 'npm install' to install dependencies"
    fi
    echo ""
    exit 1
fi
