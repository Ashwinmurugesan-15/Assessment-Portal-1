# UI Buttons Added - Quick Guide

## ✅ Feature 1: Delete User Buttons (Admin Panel)

### Location:
**Admin → User Management** (`/admin/users`)

### What You'll See:
- **Examiners Table**: New "Actions" column with red "Delete" button for each examiner
- **Candidates Table**: New "Actions" column with red "Delete" button for each candidate

### How to Use:
1. Go to `/admin/users` page (or click "User Management" from examiner dashboard)
2. Find the user you want to delete in either the Examiners or Candidates table
3. Click the red **"Delete"** button in the Actions column
4. Confirm the deletion in the popup dialog
5. User will be removed from:
   - Users database
   - All assessment assignments
   - Results are preserved for audit

### Button Appearance:
```
┌────────────────────────────────────────────────────────┐
│ Name    │ Email         │ Created  │ Role     │ Actions│
├────────────────────────────────────────────────────────┤
│ John    │ john@test.com │ Nov 24   │ Candidate│ [🗑️ Delete] │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Feature 2: Grant Retake Button (Examiner Assessment View)

### Location:
**Examiner Dashboard → Click on an Assessment** (`/examiner/assessment/[id]`)

### What You'll See:
- In the "Submission Results" table at the bottom
- New "Actions" column with green "Grant Retake" button for each candidate who submitted

### How to Use:
1. Go to examiner dashboard
2. Click on any assessment to view details
3. Scroll down to "Submission Results" table
4. Find the candidate you want to allow a retake
5. Click the green **"Grant Retake"** button
6. Confirm in the popup dialog
7. Candidate can now take the test one more time

### Button Appearance:
```
┌──────────────────────────────────────────────────────────────┐
│ Candidate │ Score │ Percentage │ Submitted │ Actions         │
├──────────────────────────────────────────────────────────────┤
│ Jane Doe  │ 8/10  │ 80%        │ Nov 24    │ [🏆 Grant Retake]│
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Testing the Features

### Test Delete User:
1. Navigate to: `http://localhost:3002/admin/users`
2. You should see Delete buttons in both tables
3. Click Delete on any user
4. Confirm the dialog
5. User should disappear from the list

### Test Grant Retake:
1. Navigate to: `http://localhost:3002/examiner/dashboard`
2. Click on any assessment that has submissions
3. Scroll to "Submission Results" table
4. You should see "Grant Retake" buttons
5. Click one and confirm
6. The candidate can now retake the test

---

## 🎨 Button Styles

### Delete Button (Red):
- Background: Light red (`bg-red-100`)
- Hover: Darker red (`hover:bg-red-200`)
- Text: Dark red (`text-red-700`)
- Icon: Trash icon (🗑️)

### Grant Retake Button (Green):
- Background: Light green (`bg-green-100`)
- Hover: Darker green (`hover:bg-green-200`)
- Text: Dark green (`text-green-700`)
- Icon: Award icon (🏆)

---

## 📸 Screenshots Locations

### Admin Users Page:
```
/admin/users
├── Header with "Create User" button
├── Stats Cards (Total Candidates, Total Examiners)
├── Examiners Table
│   └── Actions column with Delete buttons ← NEW!
└── Candidates Table
    └── Actions column with Delete buttons ← NEW!
```

### Examiner Assessment View:
```
/examiner/assessment/[id]
├── Assessment Details
├── Performance Statistics
├── Questions List
└── Submission Results Table
    └── Actions column with Grant Retake buttons ← NEW!
```

---

## ⚠️ Important Notes

1. **Delete is permanent** - There's no undo, but results are preserved
2. **Retake permission is single-use** - Once used, candidate needs another grant
3. **Only assessment creator** can grant retakes
4. **Confirmation dialogs** prevent accidental actions

---

## 🔧 Troubleshooting

### "Buttons not showing"
- Make sure you're logged in as an examiner
- Refresh the page (Ctrl+F5)
- Check browser console for errors

### "Delete not working"
- Make sure you have the admin_id in localStorage
- Check network tab for API errors

### "Grant Retake not working"
- Make sure the candidate has already attempted the test
- Only the examiner who created the assessment can grant retakes
- Check that you're logged in as the correct examiner

---

## 🚀 Quick Access URLs

- Admin Users: `http://localhost:3002/admin/users`
- Examiner Dashboard: `http://localhost:3002/examiner/dashboard`
- Specific Assessment: `http://localhost:3002/examiner/assessment/YOUR_ASSESSMENT_ID`
