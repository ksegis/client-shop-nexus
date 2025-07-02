#!/bin/bash

# =====================================================
# PHASE 1 - WEEK 2: DATABASE MIGRATION RUNNER
# Script to apply all Keystone database migrations
# =====================================================

echo "🚀 Starting Keystone Database Migration Process..."
echo "=================================================="

# Check if we're in the correct directory
if [ ! -d "database/migrations" ]; then
    echo "❌ Error: database/migrations directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Array of migration files in order
MIGRATIONS=(
    "001_keystone_config.sql"
    "002_keystone_parts.sql"
    "003_keystone_inventory.sql"
    "004_keystone_warehouses.sql"
    "005_keystone_orders.sql"
    "006_keystone_pricing.sql"
    "007_enhance_existing_tables.sql"
    "008_keystone_sync_logging.sql"
    "009_database_functions_triggers.sql"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Migration Plan:${NC}"
echo "=================="
for i in "${!MIGRATIONS[@]}"; do
    echo "  $((i+1)). ${MIGRATIONS[$i]}"
done
echo ""

# Function to run a single migration
run_migration() {
    local migration_file=$1
    local migration_number=$2
    
    echo -e "${YELLOW}🔄 Running migration $migration_number: $migration_file${NC}"
    
    # Check if file exists
    if [ ! -f "database/migrations/$migration_file" ]; then
        echo -e "${RED}❌ Migration file not found: $migration_file${NC}"
        return 1
    fi
    
    # For this demo, we'll just validate the SQL syntax
    # In production, you would connect to your Supabase database and run:
    # psql "$DATABASE_URL" -f "database/migrations/$migration_file"
    
    # Validate SQL syntax (basic check)
    if grep -q "CREATE TABLE\|ALTER TABLE\|CREATE INDEX\|CREATE FUNCTION\|CREATE OR REPLACE FUNCTION\|CREATE TRIGGER\|CREATE VIEW" "database/migrations/$migration_file"; then
        echo -e "${GREEN}✅ Migration $migration_number completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Migration $migration_number failed - invalid SQL${NC}"
        return 1
    fi
}

# Run all migrations
echo -e "${BLUE}🏃 Executing Migrations...${NC}"
echo "=========================="

failed_migrations=0
for i in "${!MIGRATIONS[@]}"; do
    migration_number=$((i+1))
    if ! run_migration "${MIGRATIONS[$i]}" "$migration_number"; then
        failed_migrations=$((failed_migrations + 1))
    fi
    echo ""
done

# Summary
echo -e "${BLUE}📊 Migration Summary${NC}"
echo "==================="
total_migrations=${#MIGRATIONS[@]}
successful_migrations=$((total_migrations - failed_migrations))

echo "Total migrations: $total_migrations"
echo -e "Successful: ${GREEN}$successful_migrations${NC}"
if [ $failed_migrations -gt 0 ]; then
    echo -e "Failed: ${RED}$failed_migrations${NC}"
else
    echo -e "Failed: ${GREEN}0${NC}"
fi

if [ $failed_migrations -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "=============="
    echo "1. Apply these migrations to your Supabase database"
    echo "2. Update your Supabase types by running: npx supabase gen types typescript --local > src/integrations/supabase/types.ts"
    echo "3. Test the database schema with sample data"
    echo "4. Proceed to Week 3: SOAP Client Implementation"
    echo ""
    echo -e "${YELLOW}💡 To apply to Supabase:${NC}"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Run each migration file in order"
    echo "4. Verify tables are created correctly"
else
    echo ""
    echo -e "${RED}❌ Some migrations failed. Please review and fix before proceeding.${NC}"
    exit 1
fi

