# Debugging Guide - "Not Working" Issues

## Quick Checklist

### 1. Is the server running?
```bash
# Check if Next.js is running
# Should see: "Ready in XXXms" and a URL like http://localhost:3002
```

### 2. Check for compilation errors
Look at your terminal for any red error messages like:
- ❌ Type errors
- ❌ Module not found
- ❌ Syntax errors

### 3. Test Each Feature Separately

---

## Feature 1: One-Time Attempt - Debugging Steps

### Test 1: Can you access an assessment?
```bash
# Open browser and go to:
http://localhost:3002/api/assessments/YOUR_ASSESSMENT_ID?user_id=YOUR_USER_ID

# Expected: JSON with questions
# If error: Check what error message you get
```

### Test 2: Can you submit an assessment?
```bash
# Use Postman or curl:
curl -X POST http://localhost:3002/api/assessments/YOUR_ASSESSMENT_ID/grade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "assessment_id": "YOUR_ASSESSMENT_ID",
    "answers": [],
    "time_started": "2024-01-01T00:00:00Z",
    "time_submitted": "2024-01-01T00:05:00Z"
  }'

# Expected: JSON with score and results
```

### Test 3: Try to access the same assessment again
```bash
# Same as Test 1 - should now get 403 error
http://localhost:3002/api/assessments/YOUR_ASSESSMENT_ID?user_id=YOUR_USER_ID

# Expected: 
# {
#   "error": "You have already attempted this assessment.",
#   "already_attempted": true,
#   "attempt_count": 1
# }
```

### Test 4: Grant retake permission
```bash
curl -X POST http://localhost:3002/api/examiner/assessment/YOUR_ASSESSMENT_ID/retake \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "test-user",
    "examiner_id": "YOUR_EXAMINER_ID"
  }'

# Expected:
# {
#   "message": "Retake permission granted successfully",
#   "candidate_id": "test-user",
#   "assessment_id": "YOUR_ASSESSMENT_ID"
# }
```

---

## Feature 2: User Deletion - Debugging Steps

### Test 1: Can you get all users?
```bash
# Open browser:
http://localhost:3002/api/admin/users

# Expected: JSON with array of users
```

### Test 2: Can you delete a user?
```bash
curl -X DELETE http://localhost:3002/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_TO_DELETE",
    "admin_id": "YOUR_ADMIN_ID"
  }'

# Expected:
# {
#   "message": "Candidate deleted successfully",
#   "deleted_user": { ... }
# }
```

---

## Common Issues & Solutions

### Issue 1: "Assessment not found"
**Problem**: The assessment ID doesn't exist in data/assessments.json

**Solution**:
1. Check `data/assessments.json` file
2. Make sure you're using a valid assessment ID
3. Create a test assessment first

### Issue 2: "User not found"
**Problem**: The user ID doesn't exist in data/users.json

**Solution**:
1. Check `data/users.json` file
2. Use a valid user ID from the file
3. Create test users first

### Issue 3: "Port already in use"
**Problem**: Another process is using the port

**Solution**:
```bash
# Kill the process or use a different port
# The server will automatically try 3001, 3002, etc.
```

### Issue 4: "Cannot read property..."
**Problem**: Missing data files

**Solution**:
```bash
# Create the data directory and files
mkdir data
echo "[]" > data/assessments.json
echo "[]" > data/users.json
echo "[]" > data/results.json
```

### Issue 5: TypeScript errors
**Problem**: Type mismatches

**Solution**:
1. Check the terminal for specific error messages
2. Make sure all imports are correct
3. Restart the dev server: Ctrl+C then `npm run dev`

---

## File Locations to Check

### 1. Database files (data directory)
```
data/
├── assessments.json  ← All assessments
├── users.json        ← All users (candidates & examiners)
└── results.json      ← All test results
```

### 2. API endpoints
```
app/api/
├── assessments/[id]/
│   ├── route.ts           ← GET assessment (with attempt check)
│   └── grade/route.ts     ← POST to submit (with attempt check)
├── examiner/assessment/[id]/
│   └── retake/route.ts    ← POST/DELETE retake permissions
└── admin/
    └── users/route.ts     ← GET users, DELETE user
```

---

## Manual Testing Steps

### Step-by-Step Test: One-Time Attempt

1. **Create a test assessment** (if you don't have one)
   - Use the assessment creation endpoint
   - Note the assessment ID

2. **Create a test candidate** (if you don't have one)
   - Use the signup endpoint
   - Note the candidate ID

3. **First attempt** - Open browser DevTools (F12)
   ```javascript
   // In browser console:
   fetch('/api/assessments/YOUR_ID?user_id=CANDIDATE_ID')
     .then(r => r.json())
     .then(console.log)
   // Should show questions
   ```

4. **Submit answers**
   ```javascript
   fetch('/api/assessments/YOUR_ID/grade', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       user_id: 'CANDIDATE_ID',
       assessment_id: 'YOUR_ID',
       answers: [],
       time_started: new Date().toISOString(),
       time_submitted: new Date().toISOString()
     })
   }).then(r => r.json()).then(console.log)
   // Should show results
   ```

5. **Try again** (should fail)
   ```javascript
   fetch('/api/assessments/YOUR_ID?user_id=CANDIDATE_ID')
     .then(r => r.json())
     .then(console.log)
   // Should show error: "already attempted"
   ```

6. **Grant retake**
   ```javascript
   fetch('/api/examiner/assessment/YOUR_ID/retake', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       candidate_id: 'CANDIDATE_ID',
       examiner_id: 'EXAMINER_ID'
     })
   }).then(r => r.json()).then(console.log)
   // Should show success message
   ```

7. **Try again** (should work now)
   ```javascript
   fetch('/api/assessments/YOUR_ID?user_id=CANDIDATE_ID')
     .then(r => r.json())
     .then(console.log)
   // Should show questions again
   ```

---

## What to Report if Still Not Working

Please provide:

1. **Exact error message** you're seeing
2. **Which step** is failing (accessing assessment, submitting, granting retake, etc.)
3. **Browser console errors** (F12 → Console tab)
4. **Server terminal output** (any red error messages)
5. **What you expected** vs **what actually happened**

Example:
```
❌ Not working: "When I try to access the assessment a second time, 
                 it still shows the questions instead of blocking me"

✅ Good report: "Step 3 failing - accessing assessment second time returns 
                 200 OK with questions, but expected 403 Forbidden. 
                 Browser console shows no errors. 
                 Server terminal shows: 'GET /api/assessments/123 200'"
```

---

## Quick Fix: Restart Everything

If nothing works:
```bash
# 1. Stop the server (Ctrl+C)
# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev

# 4. Test again
```
