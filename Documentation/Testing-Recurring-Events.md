# Testing Guide: Recurring Events in Availability Heatmap

## Prerequisites

1. Have admin access to the application
2. Have at least one participant with recurring events
3. Access to the admin event creation panel

## Test Scenarios

### Scenario 1: Weekly Recurring Event

**Setup:**
1. Create a recurring event for a user (e.g., "Team Meeting" every Monday 9:00-10:00 AM)
2. Set recurrence pattern: `{ "frequency": "weekly", "daysOfWeek": [1] }` (Monday = 1)
3. Add the user as a participant

**Test:**
1. Open admin panel → Create New Event
2. Select the user as a participant
3. Choose date range that includes multiple Mondays (e.g., next 4 weeks)
4. Proceed to availability heatmap

**Expected Result:**
- All Monday 9:00-10:00 AM slots should show as red (busy)
- Other days should show availability normally
- Console should log: "Fetched events for participants: X events" with recurring count

### Scenario 2: Multiple Days Weekly Recurring

**Setup:**
1. Create event recurring on Monday, Wednesday, Friday
2. Recurrence pattern: `{ "frequency": "weekly", "daysOfWeek": [1, 3, 5] }`

**Test:**
1. Select participant and date range covering 2 weeks
2. View heatmap

**Expected Result:**
- Mon, Wed, Fri should show busy times
- Tue, Thu should show normal availability

### Scenario 3: Recurring Event with Exception Dates

**Setup:**
1. Create weekly recurring event
2. Add exception dates (e.g., skip one Monday due to holiday)
3. Pattern: `{ "frequency": "weekly", "daysOfWeek": [1], "exceptionDates": ["2025-11-04"] }`

**Test:**
1. Select date range including the exception date
2. View heatmap

**Expected Result:**
- Most Mondays show as busy
- Exception date Monday shows as available

### Scenario 4: Recurring Event with End Date

**Setup:**
1. Create recurring event with `recurrence_end_date` set
2. Example: Weekly event that ends in 2 weeks

**Test:**
1. Select date range covering 4 weeks
2. View heatmap

**Expected Result:**
- First 2 weeks show busy times
- Last 2 weeks show as available (recurrence ended)

### Scenario 5: Mix of Recurring and One-off Events

**Setup:**
1. User has both recurring weekly meetings
2. Plus one-off events (e.g., special training session)

**Test:**
1. Select date range
2. View heatmap

**Expected Result:**
- Both recurring instances and one-off events appear as busy
- Console logs show counts of both types

## Debugging

### Check Browser Console

Look for these log messages:
```
Fetched events for participants: X events
Recurring events: Y
One-off events: Z
Expanding recurring events...
Expanded events: N instances
```

### Verify Database

Check events table:
```sql
SELECT 
  id, 
  title, 
  is_recurring, 
  recurrence_pattern,
  start_time,
  end_time
FROM events
WHERE is_recurring = true;
```

### Check Network Tab

1. Open browser DevTools → Network
2. Filter for API calls to events endpoint
3. Verify response includes recurring events

## Common Issues

### Issue: No recurring events showing

**Possible causes:**
1. Events not marked as `is_recurring = true`
2. `recurrence_pattern` is null or malformed
3. Date range doesn't include any instances
4. User not added as participant

**Solution:**
- Check database records
- Verify recurrence_pattern JSON structure
- Expand date range
- Verify event_participants table

### Issue: Events showing on wrong days

**Possible causes:**
1. Timezone issues (UTC vs local time)
2. Incorrect `daysOfWeek` values in pattern
3. Browser timezone different from server

**Solution:**
- Check time components in database
- Verify daysOfWeek array (0=Sunday, 6=Saturday)
- Test with UTC times

### Issue: Too many instances showing

**Possible causes:**
1. No recurrence_end_date set
2. Exception dates not working
3. Multiple overlapping recurring events

**Solution:**
- Set recurrence_end_date
- Verify exception dates format (ISO date strings)
- Check for duplicate events in database

## Success Criteria

✅ Recurring events appear as busy times in heatmap
✅ Correct number of instances within date range
✅ Exception dates are respected
✅ Recurrence end dates are honored
✅ Console logs show correct event counts
✅ Both recurring and one-off events display together
✅ Performance is acceptable (< 2 seconds to load)
