# One-Time Attempt Restriction - Test Guide

## ✅ Feature Now Active!

Candidates can now only take each assessment **once** unless the examiner grants retake permission.

---

## 🧪 Testing the One-Time Attempt Feature

### Test 1: First Attempt (Should Work) ✅

**Steps:**
1. Login as candidate: `jagadeeshdec24@gmail.com` / `6381813711`
2. Go to candidate dashboard
3. Click on any assessment
4. **Expected:** Assessment loads normally
5. Take the test and submit
6. **Expected:** Submission succeeds, shows results

---

### Test 2: Second Attempt (Should Be Blocked) ❌

**Steps:**
1. Stay logged in as the same candidate
2. Try to access the same assessment again (click on it from dashboard or use direct URL)
3. **Expected:** 
   - Alert message: "You have already attempted this assessment. Contact the examiner if you need to retake it."
   - Redirected to candidate dashboard
   - Cannot see the questions

---

### Test 3: Grant Retake Permission ✅

**Steps:**
1. Login as examiner who created the assessment
2. Go to examiner dashboard
3. Click on the assessment the candidate took
4. Scroll to "Submission Results"
5. Find the candidate's row
6. Click **"Grant Retake"** button
7. Confirm the dialog
8. **Expected:** Success message

---

### Test 4: Retake After Permission Granted ✅

**Steps:**
1. Login as the candidate again
2. Go to the same assessment
3. **Expected:** Assessment loads (retake allowed)
4. Take the test and submit
5. **Expected:** Submission succeeds
6. Try to access again
7. **Expected:** Blocked again (permission was consumed)

---

## 🔒 How It Works

### Two-Layer Protection:

#### Layer 1: Frontend Check (When Loading Assessment)
```typescript
// Fetches with user_id
GET /api/assessments/{id}?user_id={userId}

// Backend checks attempts
if (attemptCount > 0 && !hasRetakePermission) {
    return 403 Forbidden
}
```

#### Layer 2: Backend Check (When Submitting)
```typescript
// Double-checks on submission
POST /api/assessments/{id}/grade

// Validates attempts again
if (attemptCount > 0 && !hasRetakePermission) {
    return 403 Forbidden
}
```

---

## 📊 Expected Behavior

| Scenario | Can Access? | Can Submit? |
|----------|-------------|-------------|
| First attempt | ✅ Yes | ✅ Yes |
| Second attempt (no permission) | ❌ No | ❌ No |
| After retake granted | ✅ Yes | ✅ Yes |
| Third attempt (permission consumed) | ❌ No | ❌ No |

---

## 🎯 User Experience

### First Time Taking Test:
```
1. Click assessment → Loads normally ✅
2. Answer questions
3. Submit → Success ✅
4. See results
```

### Trying to Retake (Blocked):
```
1. Click same assessment
2. Alert: "You have already attempted this assessment..."
3. Redirected to dashboard ❌
4. Cannot access questions
```

### After Examiner Grants Retake:
```
1. Click assessment → Loads normally ✅
2. Answer questions
3. Submit → Success ✅
4. Permission consumed
5. Try again → Blocked ❌
```

---

## 🔍 Verification Points

### Check 1: Assessment List
- Candidate can see all assigned assessments
- Already attempted ones should still be visible
- But clicking them should block access

### Check 2: Direct URL Access
- Even with direct URL, blocked if already attempted
- Example: `http://localhost:3002/assessment/abc123`
- Should redirect to dashboard with alert

### Check 3: API Protection
- Cannot bypass by calling API directly
- Both GET and POST endpoints check attempts
- Returns 403 Forbidden if already attempted

---

## ⚠️ Important Notes

### Retake Permission is Single-Use:
- ✅ Examiner grants retake
- ✅ Candidate takes test again
- ❌ Permission automatically removed
- ❌ Candidate blocked on next attempt

### Multiple Candidates:
- Each candidate tracked separately
- Candidate A's attempt doesn't affect Candidate B
- Each has their own attempt count

### Different Assessments:
- Restriction is per-assessment
- Taking Assessment A doesn't block Assessment B
- Each assessment tracked independently

---

## 🐛 Troubleshooting

### "Still able to take multiple times"
**Possible causes:**
1. Not logged in (no user_id sent)
2. Browser cache (hard refresh: Ctrl+Shift+R)
3. Different user accounts
4. Examiner/Admin role (may have different permissions)

**Solution:**
- Make sure you're logged in as a candidate
- Clear browser cache
- Use the same user account
- Check the user_id in localStorage

### "Can't access even first time"
**Possible causes:**
1. Already attempted before
2. Old results in database

**Solution:**
- Check if there are existing results for this user
- Examiner can grant retake permission
- Or delete old results from database

---

## 📝 Summary

**The one-time attempt restriction is now active!**

✅ Candidates can take each test only once
✅ Blocked from accessing after first attempt
✅ Examiners can grant retake permission
✅ Retake permission is single-use
✅ Works for all assessments independently

**Test it now to confirm it's working!** 🎉

---

## 🔧 Technical Details

### Files Modified:
1. `app/assessment/[id]/page.tsx` - Added user_id to fetch request
2. `app/api/assessments/[id]/route.ts` - Already had attempt check
3. `app/api/assessments/[id]/grade/route.ts` - Already had attempt check

### Flow:
```
User clicks assessment
    ↓
Frontend gets user_id from localStorage
    ↓
Fetches: GET /api/assessments/123?user_id=abc
    ↓
Backend checks: getUserAttemptCount(123, abc)
    ↓
If count > 0 and no retake permission → 403 Forbidden
    ↓
Frontend shows alert and redirects
```
