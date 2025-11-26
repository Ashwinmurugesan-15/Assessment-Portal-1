# New Features Implementation Guide

## Feature 1: One-Time Test Attempt with Retake Permission

### Overview
Candidates can now only attempt each assessment **once** by default. If they need to retake the test, the examiner must explicitly grant them permission.

### How It Works

#### For Candidates:
1. **First Attempt**: Candidate can take the test normally
2. **Subsequent Attempts**: If they try to access the same assessment again, they will receive an error:
   ```json
   {
     "error": "You have already attempted this assessment.",
     "already_attempted": true,
     "attempt_count": 1
   }
   ```

#### For Examiners:
Examiners can grant retake permission through the API:

**Grant Retake Permission:**
```http
POST /api/examiner/assessment/{assessment_id}/retake
Content-Type: application/json

{
  "candidate_id": "candidate-123",
  "examiner_id": "examiner-456"
}
```

**Response:**
```json
{
  "message": "Retake permission granted successfully",
  "candidate_id": "candidate-123",
  "assessment_id": "assessment-789"
}
```

**Revoke Retake Permission:**
```http
DELETE /api/examiner/assessment/{assessment_id}/retake
Content-Type: application/json

{
  "candidate_id": "candidate-123",
  "examiner_id": "examiner-456"
}
```

### Technical Details

**Database Changes:**
- Added `retake_permissions` field to assessments (array of candidate IDs)
- Added `getUserAttemptCount()` function to track attempts

**API Changes:**
1. **GET /api/assessments/{id}**: Now checks attempt count before returning questions
2. **POST /api/assessments/{id}/grade**: Validates attempt count before grading
3. **New Endpoint**: `/api/examiner/assessment/{id}/retake` for managing retake permissions

**Workflow:**
1. Candidate attempts test → Result saved
2. Candidate tries again → Blocked (403 Forbidden)
3. Examiner grants retake → Candidate ID added to `retake_permissions`
4. Candidate attempts again → Allowed (permission consumed and removed)

---

## Feature 2: Admin User Deletion

### Overview
Admins can now delete candidates and examiners from the system. Deletion includes cascading cleanup of all related data.

### How It Works

**Delete a User:**
```http
DELETE /api/admin/users
Content-Type: application/json

{
  "user_id": "user-123",
  "admin_id": "admin-456"
}
```

**Success Response:**
```json
{
  "message": "Candidate deleted successfully",
  "deleted_user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate"
  }
}
```

**Error Responses:**
```json
// User not found
{
  "error": "User not found"
}

// Missing parameters
{
  "error": "user_id and admin_id are required"
}
```

### What Gets Deleted

When a user is deleted:
1. ✅ User record removed from `users.json`
2. ✅ User removed from all assessment `assigned_to` arrays
3. ✅ User's results remain in the system (for audit purposes)

**Note:** Results are preserved to maintain assessment analytics and history.

### Technical Details

**Database Changes:**
- Added `deleteUser(userId)` function
- Cascading delete: removes user from all assessments

**Security:**
- Requires both `user_id` and `admin_id`
- Validates admin exists before deletion
- Validates target user exists

---

## API Endpoints Summary

### Retake Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/examiner/assessment/{id}/retake` | Grant retake permission |
| DELETE | `/api/examiner/assessment/{id}/retake` | Revoke retake permission |

### User Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users` | Delete a user |

---

## Usage Examples

### Example 1: Candidate Retake Flow

```javascript
// 1. Candidate attempts test
const result = await fetch('/api/assessments/123/grade', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'candidate-1',
    answers: [...]
  })
});
// ✅ Success - first attempt

// 2. Candidate tries again
const secondAttempt = await fetch('/api/assessments/123?user_id=candidate-1');
// ❌ Error 403: "You have already attempted this assessment"

// 3. Examiner grants retake
await fetch('/api/examiner/assessment/123/retake', {
  method: 'POST',
  body: JSON.stringify({
    candidate_id: 'candidate-1',
    examiner_id: 'examiner-1'
  })
});
// ✅ Permission granted

// 4. Candidate attempts again
const retake = await fetch('/api/assessments/123/grade', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'candidate-1',
    answers: [...]
  })
});
// ✅ Success - retake allowed (permission consumed)
```

### Example 2: Admin Deletes User

```javascript
// Admin deletes a candidate
const response = await fetch('/api/admin/users', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'candidate-123',
    admin_id: 'admin-456'
  })
});

const result = await response.json();
console.log(result.message); // "Candidate deleted successfully"
```

---

## Database Schema Updates

### Assessment Object
```typescript
{
  id: string;
  title: string;
  questions: QuestionWithAnswer[];
  created_by: string;
  assigned_to: string[];
  retake_permissions?: string[];  // ← NEW: IDs of candidates allowed to retake
}
```

### Result Object (unchanged)
```typescript
{
  assessment_id: string;
  user_id: string;
  result: GradingResult;
  timestamp: string;
}
```

---

## Testing Checklist

### Retake Feature
- [ ] Candidate can take test first time
- [ ] Candidate blocked on second attempt
- [ ] Examiner can grant retake permission
- [ ] Candidate can retake after permission granted
- [ ] Permission is consumed after retake
- [ ] Only assessment creator can grant permissions

### Delete Feature
- [ ] Admin can delete candidate
- [ ] Admin can delete examiner
- [ ] User removed from all assessments
- [ ] Results are preserved
- [ ] Error handling for non-existent users
- [ ] Error handling for missing parameters

---

## Security Considerations

1. **Retake Permissions**: Only the examiner who created the assessment can grant/revoke retake permissions
2. **User Deletion**: Requires admin authentication (can be enhanced with role-based access control)
3. **Attempt Tracking**: Stored server-side, cannot be manipulated by candidates
4. **Data Integrity**: Cascading deletes ensure no orphaned references

---

## Future Enhancements

- [ ] Add admin role verification for delete operations
- [ ] Add bulk retake permission grants
- [ ] Add UI for managing retake permissions
- [ ] Add email notifications when retake is granted
- [ ] Add soft delete option (archive instead of delete)
- [ ] Add restore deleted user functionality
