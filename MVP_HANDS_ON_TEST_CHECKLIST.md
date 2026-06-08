# Melody Mixer Network MVP Hands-On Test

Use this checklist from top to bottom. Record anything confusing, even when the feature technically works.

## Test Setup

- [ ] Rails is healthy at `http://localhost:3001/up`.
- [ ] Next.js loads at `http://localhost:3000`.
- [ ] Use one admin account and at least two host accounts.
- [ ] Open browser developer tools and confirm there are no red console errors.
- [ ] Repeat the core host flow once on a phone-sized viewport.

## Defect Log

For every problem, record:

```text
Page:
Account/role:
What I tried:
What I expected:
What happened:
Could I recover without restarting:
Screenshot:
Severity: blocker / confusing / cosmetic
```

## 1. Authentication

- [ ] Sign in with the admin email using different capitalization.
- [ ] Sign out and confirm protected pages no longer expose station data.
- [ ] Enter a wrong password and confirm the error is understandable.
- [ ] Request a password reset with a real email.
- [ ] Request a password reset with an unknown email and confirm the response does not reveal whether the account exists.
- [ ] Complete a password reset from the emailed link.

## 2. Host Invitations

- [ ] Create an unrestricted invitation.
- [ ] Create an invitation restricted to one email.
- [ ] Copy the complete invite message.
- [ ] Register a new host using the restricted invitation.
- [ ] Confirm the invitation cannot be reused.
- [ ] Revoke an unused invitation and confirm registration fails.

## 3. Host Administration

- [ ] Confirm the new host appears in Host Team.
- [ ] Pause the host and confirm sign-in is blocked.
- [ ] Reactivate the host and confirm sign-in works.
- [ ] Confirm pausing access does not delete shows or uploads.

## 4. Station Library

- [ ] Upload one music track from Host A.
- [ ] Upload one host break from Host A.
- [ ] Sign in as Host B and confirm both shared items are visible.
- [ ] Confirm Host B can listen and add them to a show.
- [ ] Confirm Host B cannot edit Host A's library metadata.
- [ ] Filter by title, artist, genre, duration, uploader, type, and explicit status.
- [ ] Change sorting between artist, title, newest, and duration.
- [ ] Expand “See more and listen” and play the audio.
- [ ] Add a library item to a new show.
- [ ] Add a library item to an existing draft or needs-edits show.

## 5. Upload Failure Recovery

- [ ] Try an unsupported file type.
- [ ] Try a file larger than the configured limit if a safe test file is available.
- [ ] Cancel the file picker and confirm the page remains usable.
- [ ] Disconnect the backend during an upload and confirm the failure message is recoverable.
- [ ] Retry the upload after reconnecting.

## 6. Build a Show

- [ ] Create a show with a title and useful description.
- [ ] Add a shared library song.
- [ ] Upload a new song.
- [ ] Record a host introduction.
- [ ] Add a second host break.
- [ ] Reorder the lineup.
- [ ] Expand each lineup item and verify metadata.
- [ ] Play every item.
- [ ] Save the show as a draft.
- [ ] Reload the page and reopen the draft.
- [ ] Confirm the order, audio, and metadata persisted.

## 7. Submission Rules

- [ ] Attempt submission with an empty lineup.
- [ ] Attempt submission with missing audio.
- [ ] Attempt submission with a zero-duration item.
- [ ] Confirm audio permission.
- [ ] Confirm metadata accuracy.
- [ ] Mark explicit content accurately.
- [ ] Submit the valid show.
- [ ] Confirm the host can clearly see that it is awaiting review.

## 8. Admin Review

- [ ] Open the submitted show in Station Review.
- [ ] Use Continuous Show Preview and let it advance automatically.
- [ ] Use Previous and Next.
- [ ] Listen to an individual item.
- [ ] Return the show for edits with a clear note.
- [ ] Sign in as the host and confirm the note is visible.
- [ ] Fix and resubmit the show.
- [ ] Mark the corrected show ready.

## 9. Scheduling

- [ ] Schedule the show in Mountain Time.
- [ ] Schedule another show directly after it and confirm this is allowed.
- [ ] Attempt an overlapping schedule and confirm it is rejected clearly.
- [ ] Confirm both shows appear correctly in Programming Clock.
- [ ] Confirm gaps and coverage totals make sense.

## 10. Stream Package

- [ ] Queue the scheduled show for provider-ready export.
- [ ] Confirm package mode, asset count, duration, and ordered playout.
- [ ] Confirm cumulative start/end offsets are correct.
- [ ] Reopen the queued show for edits.
- [ ] Confirm its schedule and previous package are cleared.

## 11. Public Station Page

- [ ] Open Alpine Groove Guide while signed out.
- [ ] Confirm current, next, and upcoming shows are correct.
- [ ] Confirm all dates and times are Mountain Time.
- [ ] Confirm private audio URLs and admin information are not exposed.
- [ ] Confirm the missing-stream state is understandable until AzuraCast is connected.

## 12. Mobile and Usability

- [ ] Complete registration on a phone-sized viewport.
- [ ] Browse and filter the Library.
- [ ] Build and reorder a short show.
- [ ] Save and submit it.
- [ ] Review long titles and filenames for overflow.
- [ ] Verify every primary button is easy to tap.
- [ ] Record every label that feels technical or unclear.

## Exit Criteria

- [ ] No blocker remains.
- [ ] No workflow requires a page refresh to recover.
- [ ] No user can edit another host's shared library metadata.
- [ ] Invalid shows cannot become ready, scheduled, or queued.
- [ ] Adjacent shows work and overlaps do not.
- [ ] Admin notes and status changes are visible to hosts.
- [ ] Mobile host flow is usable without zooming.
- [ ] All confusing or cosmetic issues are recorded for triage.
