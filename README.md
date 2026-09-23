# Health Trackr

Build a polished, fully functional MVP web application called "HealthTrack".

IMPORTANT CREDIT AND SCOPE CONSTRAINT:Build this as ONE complete implementation. Do not split the work into multiple implementation phases.




This is a focused MVP. Optimize for completing the entire functional application in one generation rather than adding unnecessary sophistication.




DO NOT add features that are not explicitly requested.




DO NOT add:

- AI

- AI health coaching

- Wearable integrations

- Apple Health

- Google Fit

- Fitbit/Garmin integrations

- Nutrition APIs

- Food databases

- Notifications

- Social features

- Goals/challenges

- Payments

- Subscriptions

- Admin dashboard

- External APIs

- Complex animations

- Unnecessary third-party libraries




Use manually entered user data only.




Prioritize:

1. Authentication

2. User profile

3. Daily health tracking

4. Meal tracking

5. Weight tracking

6. Dashboard

7. Real database persistence

8. Responsive UI




Do not create mock data or placeholder functionality.




==================================================

PRODUCT

==================================================




HealthTrack is a personal health and fitness tracker.




The authenticated user can track:




- Steps

- Meals

- Calories

- Sleep

- Workout completion

- Workout type

- Water consumed

- Weight

- Height

- Gender




The user can associate health information with specific dates and view monthly progress.




Primary user story:




"As a user, I want to track my daily health and fitness activities so that I can understand my progress over time."




==================================================

TECH STACK

==================================================




Use the simplest supported Lovable architecture.




Use:

- React

- TypeScript

- Tailwind CSS

- shadcn/ui or equivalent existing UI components

- Lucide icons

- Lovable Cloud/Supabase-backed authentication and database




Do not introduce unnecessary frameworks or libraries.




Use real persistent database data.




==================================================

AUTHENTICATION

==================================================




Create:




1. Sign Up

2. Login

3. Logout

4. Protected application routes




SIGN UP fields:




- Full Name

- Gender

- Email

- Password

- Confirm Password




Gender options:




- Male

- Female

- Other

- Prefer not to say




Gender is optional.




After signup:

- create the authenticated user

- create the user's profile

- redirect to Dashboard




Login:

- Email

- Password




Unauthenticated users should not access application pages.




==================================================

DATABASE

==================================================




Create only the minimum database structure required.




TABLE 1: profiles




Fields:

- id

- user_id

- full_name

- gender

- height

- height_unit

- current_weight

- weight_unit

- created_at

- updated_at




TABLE 2: daily_health_records




Fields:

- id

- user_id

- record_date

- steps

- sleep_hours

- workout_done

- workout_type

- water_litres

- created_at

- updated_at




Ensure only one daily record exists per user per date.




TABLE 3: meals




Fields:

- id

- user_id

- meal_date

- meal_type

- meal_name

- calories

- created_at

- updated_at




A user can have multiple meals on one date.




TABLE 4: weight_entries




Fields:

- id

- user_id

- entry_date

- weight

- weight_unit

- created_at

- updated_at




Use authenticated user_id for all records.




Enable Row Level Security so users can only access their own data.




Do not implement complicated database logic beyond what is required above.




==================================================

APPLICATION NAVIGATION

==================================================




Create a simple responsive application shell.




Desktop:

- Left sidebar




Mobile:

- Compact top/mobile navigation




Navigation items:




- Dashboard

- Daily Tracker

- Weight Progress

- Profile




Also show:

- User name

- Logout




==================================================

DASHBOARD

==================================================




Create the main Dashboard.




Default to the current month.




Allow:

- Previous month

- Next month

- Current month




At the top show:




"Good morning, [Name]"




Then show six simple KPI cards:




1. Average Steps

2. Average Calories

3. Average Sleep

4. Workout Days

5. Average Water

6. Weight Change




All values must come from actual database data.




Do not use mock values.




==================================================

DASHBOARD VISUALIZATION

==================================================




Keep analytics intentionally simple.




Create:




1. Daily Activity Trend

   - Show steps, calories and water over the selected month.

   - Use a clean chart suitable for multiple metrics.




2. Weight Trend

   - Show weight over time.




3. Monthly Tracking Grid

   - Show dates of the selected month.

   - Indicate whether the user has recorded:

     - Steps

     - Meals

     - Sleep

     - Workout

     - Water




Do not create additional charts.




If no data exists, show a clean empty state.




==================================================

DAILY TRACKER

==================================================




Create a Daily Tracker page.




At the top:




Date picker




Default:

Today




The user can select any past or current date.




When a date is selected:

- load existing data for that date

- populate the form if data exists

- otherwise show empty fields




==================================================

DAILY HEALTH DATA

==================================================




For the selected date allow the user to enter:




STEPS

- Number of steps

- Minimum 0




SLEEP

- Hours

- Allow decimals

- 0 to 24




WORKOUT

- Did you work out? Yes / No




If Yes, show Workout Type dropdown:




- Chest

- Back

- Shoulders

- Legs

- Full Body

- Cardio

- Other




If No, workout type should be empty.




WATER

- Litres consumed

- Allow decimals

- Minimum 0




Provide one clear:




"Save Daily Data"




button.




If a daily record already exists:

- update it




If no daily record exists:

- create it




Never create duplicate records for the same user/date.




==================================================

MEAL TRACKING

==================================================




On the Daily Tracker page, create a Meals section.




The user can add multiple meals for the selected date.




Each meal contains:




Meal Type:

- Breakfast

- Lunch

- Dinner

- Snack




Meal Name:

- Free text




Calories:

- Number




Allow:




- Add Meal

- Edit Meal

- Delete Meal




Show:




Total Calories Today




Calculate automatically as:




SUM(all meals for selected date)




Do not ask the user to manually enter total calories.




==================================================

DAILY SUMMARY

==================================================




Below the tracker, show a compact summary:




- Steps

- Total Calories

- Sleep

- Workout

- Workout Type

- Water




Keep this visually simple.




==================================================

WEIGHT PROGRESS

==================================================




Create a Weight Progress page.




Allow the user to:




- Add weight

- Edit weight

- Delete weight




Each entry contains:




- Date

- Weight

- Unit




Supported units:

- kg

- lbs




Default:

kg




Show:




- Starting Weight

- Current Weight

- Total Weight Change

- Weight Trend Chart

- Weight History




Weight history:




Date | Weight | Change




Sort newest entries first.




==================================================

PROFILE

==================================================




Create a Profile page.




Allow editing:




- Full Name

- Gender

- Height

- Height Unit

- Current Weight

- Weight Unit




Gender options:




- Male

- Female

- Other

- Prefer not to say




Gender is optional.




Height units:

- cm

- ft/in




Weight units:

- kg

- lbs




Save the information to the authenticated user's profile.




Gender is private profile information and must not be visible to other users.




Do not make health or calorie assumptions based on gender.




==================================================

BMI

==================================================




Show BMI on the Profile page when height and weight are available.




Formula:




BMI = weight in kg / height in meters²




If height or weight is missing:




"Add height and weight to calculate BMI."




BMI is informational only.




Do not provide medical diagnosis or medical advice.




==================================================

CALCULATIONS

==================================================




Implement these automatically:




Daily Calories:

SUM meals for the selected date.




Average Monthly Calories:

Average only across days where calorie data exists.




Average Monthly Steps:

Average only across days where step data exists.




Average Sleep:

Average recorded sleep values.




Average Water:

Average recorded water values.




Workout Days:

Number of days where workout_done = true.




Weight Change:

Latest recorded weight minus earliest recorded weight.




Do not treat missing data as zero for averages.




==================================================

VALIDATION

==================================================




Use basic sensible validation.




Steps:

>= 0




Sleep:

0–24




Water:

>= 0




Calories:

>= 0




Weight:

> 0




Meal name:

Required




Meal type:

Required




Workout type:

Required only when workout = Yes




Date:

Required




Show simple inline validation messages.




==================================================

UX

==================================================




Create a polished modern health/fitness UI.




Style:




- Clean

- Minimal

- Professional

- Modern

- Light visual hierarchy

- Rounded cards

- Subtle shadows

- Clear typography

- Health-oriented but not overly colorful




Use responsive layouts.




Provide:

- Loading states

- Empty states

- Success toast

- Error toast

- Disabled save buttons while saving




Do not create elaborate animations.




==================================================

RESPONSIVE

==================================================




The application must work on:




- Desktop

- Tablet

- Mobile




Mobile requirements:




- Responsive navigation

- Single-column cards

- Mobile-friendly forms

- Touch-friendly buttons

- Responsive charts

- No horizontal page overflow




==================================================

SECURITY

==================================================




All records must belong to the authenticated user.




Use authenticated user_id rather than accepting arbitrary user IDs from the client.




Enable Row Level Security.




Users must only be able to read/write/delete their own:




- Profile

- Daily health records

- Meals

- Weight entries




==================================================

DATA BEHAVIOR

==================================================




When the user selects a date on Daily Tracker:




1. Retrieve that user's daily record.

2. Retrieve that user's meals for that date.

3. Populate the UI.

4. Allow editing.

5. Save changes to the database.

6. Refresh the daily summary.




When dashboard month changes:




- Retrieve only the selected month's data.

- Recalculate KPIs.

- Update charts.

- Update tracking grid.




When data changes:




- Dashboard should reflect the updated data.




==================================================

EMPTY STATES

==================================================




Dashboard:




"No health data yet.

Start tracking your daily activity to see your progress."




Meals:




"No meals recorded for this date."




Weight:




"No weight entries yet."




Charts:




"No data available for this period."




==================================================

FINAL DEFINITION OF DONE

==================================================




The application is complete only when all of the following work:




AUTH:

- Signup

- Login

- Logout

- Protected routes




PROFILE:

- Name

- Gender

- Height

- Weight

- Units

- BMI




DAILY TRACKER:

- Date selection

- Steps

- Sleep

- Workout Yes/No

- Workout type

- Water

- Save/update




MEALS:

- Add

- Edit

- Delete

- Calories

- Automatic daily calorie total




WEIGHT:

- Add

- Edit

- Delete

- History

- Trend chart




DASHBOARD:

- Monthly navigation

- KPI cards

- Activity chart

- Weight chart

- Monthly tracking grid




DATA:

- Persistent database

- No mock data

- Correct calculations

- User-specific data

- Row Level Security




UX:

- Responsive desktop/mobile

- Loading states

- Empty states

- Validation

- Success/error feedback




==================================================

STRICT SCOPE CONTROL

==================================================




Do not add anything beyond this specification.




If there is a choice between:

A. Adding another feature

B. Completing and connecting an existing required feature




ALWAYS choose B.




If implementation complexity arises, simplify the UI or internal implementation rather than removing a required feature.




Do not spend implementation effort on unnecessary architectural abstraction, animations, integrations, documentation, AI functionality, or advanced analytics.




The goal is a complete, polished, functional HealthTrack MVP in ONE build.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://healthtrack-my-day.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1846a80-2221-4509-95c2-96024b5b57a9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
