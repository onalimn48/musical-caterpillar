# Teacher Backend V1 Plan

This document defines the minimum teacher backend worth building for Musical Caterpillar V1.

The goal is not to build a full school platform. The goal is to answer one question:

`Will a teacher pay to assign this and see whether students actually did it?`

## Product Goal

The V1 teacher workflow should be:

1. Teacher creates a class.
2. Teacher adds student names or shares a class code.
3. Teacher creates an assignment.
4. Student enters the class code once, selects their name, and plays.
5. Teacher sees completion and score.

If that loop is smooth, the backend is good enough for V1.

## V1 Scope

Build now:

- Teacher account
- Class creation
- Class code generation
- Student roster
- Student self-identification flow
- Assignment creation
- Assignment links
- Attempt/completion tracking
- Basic teacher dashboard

Do not build yet:

- Parent accounts
- Messaging
- District/school admin hierarchy
- SIS integrations
- Google Classroom sync
- Deep analytics dashboards
- Complex standards alignment
- Multi-role staff permissions
- Full curriculum builder
- Rich export/reporting suite

## Supported Games In V1

Support only the clearest teacher-use cases first:

- Note Speller
- Notes Per Minute

Wait on:

- Chord Snowman
- Caterpillar Studio
- Bearglar

Those can be added later after the assignment/completion loop works.

## Teacher UX

### 1. Teacher Sign In

Minimal options:

- Email + password
- Or magic link if preferred

V1 does not need anything more complicated.

### 2. Teacher Home

Show:

- Classes
- Recent assignments
- Completion summary
- `Create Class` button
- `Create Assignment` button

### 3. Create Class

Fields:

- Class name
- Optional description
- Class code auto-generated
- Optional age/grade label

Actions:

- Save class
- Copy class code
- Add students now
- Skip and add later

### 4. Manage Class

Show:

- Class name
- Class code
- Student roster
- Assignments for this class
- Completion snapshot

Actions:

- Add student
- Rename student
- Archive student
- Copy class code / join instructions
- Create assignment for this class

### 5. Add Students

Two roster modes:

#### Mode A: Teacher Adds Students

- Student first name
- Optional last initial
- Add one at a time
- Bulk paste names

#### Mode B: Student Self-Join Allowed

Toggle:

- `Allow students to add themselves`

If enabled:

- Student enters class code
- Student types their name once
- Student is added to class

Recommended default:

- Teacher-added roster first
- Self-join optional

### 6. Create Assignment

Fields:

- Class
- Game
- Game-specific mode/level/clef
- Assignment title
- Optional instructions
- Optional due date

Examples:

- Note Speller -> treble clef -> stage 1
- Note Speller -> bass clef -> stage 2
- Notes Per Minute -> Treble Benchmark T1
- Notes Per Minute -> Bass practice -> no ledger lines

Actions:

- Save draft
- Publish assignment
- Copy student link

### 7. Teacher Dashboard

Per class:

- Student name
- Assignment status: not started / started / completed
- Latest result
- Best result
- Last activity date

Per assignment:

- Class assigned
- Number completed
- Number not started
- Average score
- Best score

Keep this plain and readable.

## Student UX

### 1. Student Entry Page

Fields:

- Class code

After valid code:

- Show class name
- Show dropdown of student names if roster exists
- Or show name entry if self-join is allowed

If roster exists:

- Dropdown of student names
- `That's me` button
- `My name is missing` button

If self-join is allowed and name is missing:

- Input name
- Join class

### 2. Remember Student On Device

After first successful selection, save locally:

- Class ID
- Class name
- Student ID
- Student display name

On later visits on that device:

- Show `Welcome back, Ava`
- `Continue` button
- `Choose another student` button
- `Enter different class code` button

If the device has multiple saved students in the same class:

- Show a dropdown

### 3. Student Assignment Page

Show:

- Student name
- Class name
- Current assignments
- Due date if present
- `Start` button

Keep this simple. No heavy dashboard.

### 4. Post-Game Result Page

After a run:

- Save the attempt automatically
- Show:
  - completed
  - score
  - accuracy
  - best result if relevant

Buttons:

- `Play Again`
- `Back to Assignments`

## Student Name Rules

For V1:

- Allow duplicate first names
- If needed, display `Ava M.` style labels
- Prefer teacher-added names when possible

If self-join is enabled and a likely duplicate appears:

- Keep it simple
- Allow creation, but flag for teacher review later if needed

If that causes too much ambiguity, require teacher roster for paid teacher classes.

## Core V1 Data Captured

For each attempt, save:

- Assignment ID
- Class ID
- Student ID
- Teacher ID
- Game ID
- Mode/config snapshot
- Started at
- Completed at
- Status
- Score
- Accuracy
- Time spent if available
- Best metric for the game

### Game-Specific Result Data

#### Note Speller

- Clef
- Stage
- Score
- Accuracy if available
- Streak if useful

#### Notes Per Minute

- Benchmark ID or practice config
- Clef
- NPM
- Accuracy
- Qualified yes/no if benchmark

## Recommended Page Map

### Teacher Pages

- `/teacher/sign-in`
- `/teacher`
- `/teacher/classes`
- `/teacher/classes/:classId`
- `/teacher/assignments/new`
- `/teacher/assignments/:assignmentId`

### Student Pages

- `/student`
- `/student/class`
- `/student/assignments`
- `/student/assignment/:assignmentId`

## Recommended React Component Plan

### Teacher Area

#### Pages

- `TeacherSignInPage`
- `TeacherHomePage`
- `TeacherClassesPage`
- `TeacherClassDetailPage`
- `TeacherAssignmentCreatePage`
- `TeacherAssignmentDetailPage`

#### Components

- `TeacherShell`
- `ClassCard`
- `ClassCodePanel`
- `StudentRosterTable`
- `AddStudentForm`
- `BulkStudentPasteForm`
- `AssignmentForm`
- `AssignmentSummaryCard`
- `AssignmentResultsTable`
- `CompletionBadge`

### Student Area

#### Pages

- `StudentEntryPage`
- `StudentIdentityPage`
- `StudentAssignmentsPage`
- `StudentAssignmentLaunchPage`

#### Components

- `ClassCodeForm`
- `StudentNameSelect`
- `StudentNameCreateForm`
- `StudentRememberedIdentityCard`
- `AssignmentList`
- `AssignmentCard`
- `ResultSummaryCard`

### Shared Utilities

- `generateClassCode`
- `normalizeStudentName`
- `buildAssignmentConfigSnapshot`
- `mapGameResultToAttemptPayload`
- `rememberStudentOnDevice`
- `loadRememberedStudents`

## Supabase Schema

This schema is intentionally minimal.

```sql
create table teachers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  name text not null,
  description text not null default '',
  class_code text not null unique,
  allow_self_join boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  display_name text not null,
  sort_name text not null default '',
  created_by_teacher boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  game_id text not null,
  activity_config jsonb not null,
  due_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  game_id text not null,
  status text not null check (status in ('started', 'completed', 'abandoned')),
  score integer,
  accuracy numeric,
  duration_seconds integer,
  result_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
```

### Helpful Indexes

```sql
create index idx_classes_teacher_id on classes(teacher_id);
create index idx_students_class_id on students(class_id);
create index idx_assignments_class_id on assignments(class_id);
create index idx_assignment_attempts_assignment_id on assignment_attempts(assignment_id);
create index idx_assignment_attempts_student_id on assignment_attempts(student_id);
create index idx_assignment_attempts_class_id on assignment_attempts(class_id);
```

## Suggested Row-Level Security Direction

Keep RLS simple.

Teacher can:

- Read/write classes they own
- Read/write students in their classes
- Read/write assignments in their classes
- Read attempts tied to their classes

Student access in V1 should not rely on student auth.
Instead:

- Student joins/selects identity through class code flow
- API endpoints validate class code + assignment + selected student
- Use server-side route handlers where needed

This is much simpler than real student auth for young users.

## Suggested API / Server Action Surface

Teacher actions:

- `createClass`
- `updateClass`
- `addStudent`
- `bulkAddStudents`
- `archiveStudent`
- `createAssignment`
- `listAssignmentsByClass`
- `getAssignmentResults`

Student actions:

- `lookupClassByCode`
- `listStudentsByClassCode`
- `createStudentSelfJoin`
- `listAssignmentsForStudent`
- `recordAssignmentStarted`
- `recordAssignmentCompleted`

## Activity Config Shapes

Keep game config explicit and serializable.

### Note Speller Assignment Config

```json
{
  "gameId": "note-speller",
  "mode": "game",
  "clef": "treble",
  "stage": 1
}
```

### Notes Per Minute Benchmark Config

```json
{
  "gameId": "notes-per-minute",
  "runType": "benchmark",
  "presetId": "NPM-T1"
}
```

### Notes Per Minute Practice Config

```json
{
  "gameId": "notes-per-minute",
  "runType": "practice",
  "clef": "Treble",
  "durationSeconds": 60,
  "allowLedgerLines": false,
  "includeAccidentals": false
}
```

## Result Summary Shapes

### Note Speller Result Summary

```json
{
  "score": 24,
  "streak": 8,
  "clef": "treble",
  "stage": 1
}
```

### Notes Per Minute Result Summary

```json
{
  "npm": 31,
  "accuracy": 0.93,
  "qualifiedBenchmark": true,
  "presetId": "NPM-T1",
  "clef": "Treble"
}
```

## Device Memory Plan For Students

Use local storage in V1.

Suggested key:

- `musical-caterpillar-student-identities`

Store something like:

```json
[
  {
    "classId": "uuid",
    "className": "Tuesday Piano",
    "studentId": "uuid",
    "studentName": "Ava M."
  }
]
```

On student entry:

- If exactly one remembered identity exists, show quick continue
- If multiple exist, show select list
- Always include:
  - `Not you?`
  - `Join a different class`

## UX Principles

### Teacher UX Rule

A teacher should be able to do this in under 3 minutes:

1. Create class
2. Add 8 student names
3. Create one assignment
4. Copy class code or assignment link

If not, V1 is too heavy.

### Student UX Rule

After first use, a student should be able to:

1. Open the student page
2. Select name
3. Press start

in under 20 seconds.

## Recommended Build Order

### Phase 1: Core Identity

- Teacher auth
- Teacher shell
- Create class
- Generate class code
- Add roster

### Phase 2: Student Entry

- Class code lookup
- Student dropdown selection
- Self-join option
- Local remembered identity

### Phase 3: Assignments

- Assignment schema
- Assignment create form
- Assignment list for class
- Assignment list for student

### Phase 4: Results

- Attempt start event
- Attempt complete event
- Teacher results dashboard
- Best/latest result logic

### Phase 5: Cleanup

- Error states
- Empty states
- Roster management
- Duplicate-name edge cases
- Basic polish

## One-Week Implementation Roadmap

This assumes a focused V1 build.

### Day 1

- Set up Supabase project
- Create schema
- Add teacher auth
- Add teacher shell and protected routes

Deliverable:

- Teacher can sign in and see an empty dashboard

### Day 2

- Build class creation
- Build class code generation
- Build class list and class detail page
- Build add student / bulk paste student UI

Deliverable:

- Teacher can create class and roster

### Day 3

- Build student entry page
- Build class code lookup
- Build student dropdown
- Build self-join path
- Add local remembered student storage

Deliverable:

- Student can join/select into a class

### Day 4

- Build assignment schema usage
- Build assignment create page
- Support Note Speller assignment config
- Support Notes Per Minute assignment config
- Build student assignment list

Deliverable:

- Teacher can create assignments and students can see them

### Day 5

- Add attempt start and completion writes
- Map game result payloads into DB records
- Build teacher assignment detail page
- Show completion/not started/latest score

Deliverable:

- Teacher can see who completed work

### Day 6

- Improve status logic
- Add best score / latest score summaries
- Handle archived students
- Add due date UI
- Improve empty/error states

Deliverable:

- Backend loop is usable for pilots

### Day 7

- Manual QA
- Try real teacher workflow end to end
- Create seed/demo class
- Add small polish items only
- Write teacher onboarding copy

Deliverable:

- Pilot-ready V1

## Suggested Pilot Offer

Once this exists, sell a simple teacher pilot:

- Assign games to students
- Track completion
- View best/latest scores

Do not wait for a perfect dashboard.

The V1 backend is successful if teachers:

- create assignments more than once
- check results more than once
- ask for more classes/students
- say it saves time

## Final Rule

Do not build more backend just because it is technically easy.

Build the smallest backend that lets a teacher:

- assign work
- verify completion
- trust the result

Everything else is phase 2.
