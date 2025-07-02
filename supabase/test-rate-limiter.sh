
#!/bin/bash

# Replace with your actual Supabase project URL and anon key
SUPABASE_URL="https://vqkxrbflwhunvbotjdds.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk"
ENDPOINT="$SUPABASE_URL/functions/v1/rate-limiter"
TEST_IP="test-ip-$(date +%s)"

echo "Testing Rate Limiter: Will allow 10 requests, then block"
echo "Endpoint: $ENDPOINT"
echo "Using test IP: $TEST_IP"
echo "---------------------------------------------------"

for i in {1..12}; do
  echo -n "Request $i: "
  
  RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d "{\"ip\":\"$TEST_IP\",\"path\":\"login\"}")
  
  STATUS=$(echo $?)
  HTTP_STATUS=$(echo $RESPONSE | grep -o '"status":[0-9]*' | cut -d':' -f2)
  
  if [ -z "$HTTP_STATUS" ]; then
    if echo "$RESPONSE" | grep -q "error"; then
      echo "ERROR: $(echo $RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    else
      echo "SUCCESS - Requests remaining: $(echo $RESPONSE | grep -o '"remaining":[0-9]*' | cut -d':' -f2)"
    fi
  else
    echo "HTTP $HTTP_STATUS - $(echo $RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    if [ "$HTTP_STATUS" -eq 429 ]; then
      RETRY=$(echo $RESPONSE | grep -o '"retryAfter":"[^"]*"' | cut -d'"' -f4)
      echo "   Rate limit exceeded. Retry after: $RETRY"
    fi
  fi
  
  # Small delay between requests to make output more readable
  sleep 0.5
done

echo "---------------------------------------------------"
echo "Test complete!"
