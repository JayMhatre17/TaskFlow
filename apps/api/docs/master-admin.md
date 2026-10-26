# Master Admin bootstrap

TaskFlow identifies its single protected Master Admin using the existing `role = ADMIN` and `isProtectedAdmin = true` fields. There is no public API for changing roles or disabling accounts, and the bootstrap script refuses to promote another account once a protected administrator exists.

Create an ordinary account first, then configure `DATABASE_URL` for the intended deployment database and run this one-time operator command from the repository root:

```powershell
$env:MASTER_ADMIN_EMAIL = "admin@example.com"
yarn workspace api admin:bootstrap
Remove-Item Env:MASTER_ADMIN_EMAIL
```

The email must identify an existing active account. The script changes only its role and protection flag; it does not change its password or create credentials. Keep database access restricted to deployment operators. Do not run this command against the development database when setting up another environment.

Admin-created accounts are always ordinary `USER` accounts and must change the temporary password at first sign-in. Share that temporary password with the user over an approved private channel; TaskFlow does not email it.
