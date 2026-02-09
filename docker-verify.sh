#!/bin/bash

# Docker Verification Test Script
# This script tests all Docker configurations to ensure everything works

echo "🧪 Docker Configuration Verification Test"
echo "=========================================="
echo ""

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

check_passed() {
    echo "✅ PASS: $1"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo "❌ FAIL: $1"
    ((CHECKS_FAILED++))
}

# 1. Check Docker is installed
echo "1️⃣  Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_passed "Docker is installed: $DOCKER_VERSION"
else
    check_failed "Docker is not installed"
fi
echo ""

# 2. Check Docker Compose is installed
echo "2️⃣  Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    check_passed "Docker Compose is installed: $COMPOSE_VERSION"
else
    check_failed "Docker Compose is not installed"
fi
echo ""

# 3. Check required files exist
echo "3️⃣  Checking required files..."
FILES=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    "docker-build.sh"
    "docker-compose-up.sh"
    "app/api/health/route.ts"
    "next.config.ts"
    "package.json"
    ".env"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_passed "File exists: $file"
    else
        check_failed "File missing: $file"
    fi
done
echo ""

# 4. Check next.config.ts has standalone output
echo "4️⃣  Checking Next.js configuration..."
if grep -q "output.*standalone" next.config.ts; then
    check_passed "Next.js configured with standalone output"
else
    check_failed "Next.js standalone output not configured"
fi
echo ""

# 5. Check Docker scripts are executable
echo "5️⃣  Checking script permissions..."
if [ -x "docker-build.sh" ]; then
    check_passed "docker-build.sh is executable"
else
    check_failed "docker-build.sh is not executable"
fi

if [ -x "docker-compose-up.sh" ]; then
    check_passed "docker-compose-up.sh is executable"
else
    check_failed "docker-compose-up.sh is not executable"
fi
echo ""

# 6. Validate docker-compose.yml syntax
echo "6️⃣  Validating docker-compose.yml syntax..."
if docker-compose config > /dev/null 2>&1; then
    check_passed "docker-compose.yml syntax is valid"
else
    check_failed "docker-compose.yml has syntax errors"
fi
echo ""

# Summary
echo ""
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo "Passed: $CHECKS_PASSED"
echo "Failed: $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo "🎉 All checks passed! Docker configuration is ready to use."
    echo ""
    echo "You can now:"
    echo "  • Run: ./docker-build.sh"
    echo "  • Or:  docker-compose up -d"
    echo ""
    exit 0
else
    echo "⚠️  Some checks failed. Please fix the issues above."
    echo ""
    exit 1
fi
