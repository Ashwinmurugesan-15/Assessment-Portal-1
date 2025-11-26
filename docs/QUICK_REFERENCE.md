# Quick Reference: New Features

## 🔒 One-Time Test Attempt

### Problem Solved
Candidates were able to take the same test multiple times, which could lead to:
- Memorizing answers
- Unfair advantages
- Invalid assessment results

### Solution
- **Default**: Candidates can only attempt each test **once**
- **Exception**: Examiner can grant retake permission when needed

### API Calls

**Check if candidate can take test:**
```bash
GET /api/assessments/{id}?user_id={candidate_id}
```

**Grant retake permission:**
```bash
POST /api/examiner/assessment/{id}/retake
{
  "candidate_id": "...",
  "examiner_id": "..."
}
```

**Revoke retake permission:**
```bash
DELETE /api/examiner/assessment/{id}/retake
{
  "candidate_id": "...",
  "examiner_id": "..."
}
```

---

## 🗑️ Admin User Deletion

### Problem Solved
No way to remove candidates or examiners from the system.

### Solution
Admin can delete users with automatic cleanup:
- User removed from database
- User removed from all assessments
- Results preserved for analytics

### API Call

**Delete a user:**
```bash
DELETE /api/admin/users
{
  "user_id": "...",
  "admin_id": "..."
}
```

---

## 📊 Database Changes

### New Fields
```typescript
// In Assessment
{
  retake_permissions?: string[]  // Candidate IDs allowed to retake
}
```

### New Functions
```typescript
db.getUserAttemptCount(assessmentId, userId)  // Returns number
db.deleteUser(userId)                          // Returns boolean
db.updateAssessment(id, updates)               // Returns assessment
```

---

## 🔄 Workflow Diagrams

### Retake Permission Flow
```
Candidate attempts test (1st time)
         ↓
    ✅ Allowed
         ↓
    Result saved
         ↓
Candidate tries again
         ↓
    ❌ Blocked (403)
         ↓
Examiner grants retake
         ↓
Candidate tries again
         ↓
    ✅ Allowed (permission consumed)
         ↓
    Result saved
         ↓
Candidate tries again
         ↓
    ❌ Blocked (403)
```

### User Deletion Flow
```
Admin initiates delete
         ↓
Validate admin exists
         ↓
Validate user exists
         ↓
Delete user from users.json
         ↓
Remove from all assessments
         ↓
    ✅ Success
```

---

## ⚠️ Important Notes

1. **Retake permissions are single-use** - Once a candidate uses their retake permission, it's automatically removed
2. **Results are never deleted** - Even when users are deleted, their results remain for audit purposes
3. **Only assessment creators** can grant retake permissions
4. **Attempt count is server-side** - Candidates cannot manipulate it

---

## 🧪 Testing Commands

```bash
# Test retake permission grant
curl -X POST http://localhost:3000/api/examiner/assessment/123/retake \
  -H "Content-Type: application/json" \
  -d '{"candidate_id":"c1","examiner_id":"e1"}'

# Test user deletion
curl -X DELETE http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"user_id":"c1","admin_id":"a1"}'

# Test attempt check
curl http://localhost:3000/api/assessments/123?user_id=c1
```
