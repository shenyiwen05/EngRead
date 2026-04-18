# Invite Code Registration Design

## Goal

Only invited friends can register during the private beta. The single invite code is `sywww`, and it can create at most five accounts.

## Backend Behavior

Registration requires an `inviteCode` field. The backend rejects missing or incorrect codes with `400` and `邀请码无效`.

Successful registrations store the accepted invite code on the user record. Before creating a user, the service counts users registered with `sywww`; if the count is already five, registration fails with `400` and `邀请码已用完`.

Email, password, and duplicate-email validation stay unchanged. The invite code check runs before creating the user and before consuming a slot.

## Data Model

Add `invite_code` to `users`. It is nullable so existing or manually-created users can remain valid. New registrations through the public API must set it to `sywww`.

Add an Alembic migration for the new column.

## Frontend Behavior

The register page adds an invite code input. Submitting registration sends `{ email, nickname, password, inviteCode }` to `/api/auth/register`.

Backend error messages are shown using the existing form error area.

## Testing

Backend tests cover invalid invite codes, successful use of `sywww`, and the sixth attempted registration failing. Frontend tests cover the invite code field being included in the registration call and backend error messages surfacing on the page.
