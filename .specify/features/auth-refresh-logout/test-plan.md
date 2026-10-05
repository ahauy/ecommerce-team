# Test Plan — US-AUTH-002 (auth-refresh-logout)

## Test Case Mapping

| TC ID | User Story Scenario | Type | Description | Priority |
|-------|---------------------|------|-------------|----------|
| TC-101 | Scenario 1 (Happy Path) | Unit | `refresh()` with valid hash returns new accessToken | P0 |
| TC-102 | Scenario 2 (Invalid Token) | Unit | `refresh()` with unknown hash throws 401 | P0 |
| TC-103 | Scenario 3 (Banned User) | Unit | `refresh()` for banned user throws 401 | P0 |
| TC-104 | Scenario 4 (Logout) | Unit | `logout()` clears hash in DB + clears cookie | P0 |
| TC-E2E-1 | Scenario 1 (Happy Path) | E2E | Full flow: login → wait 15m → API call → auto-refresh → success | P0 |
| TC-E2E-2 | Scenario 2 (Expired Refresh) | E2E | Login → expire refresh → API call → redirect login | P1 |
| TC-E2E-3 | Scenario 4 (Logout) | E2E | Login → logout → verify cookie cleared + DB hash null | P0 |
| TC-E2E-4 | Scenario 5 (New Login) | E2E | Login device A → login device B → device A refresh fails | P1 |

## Unit Test Details (Backend)

### TC-101: Valid Refresh Token
```typescript
// Setup
user = mockUser({ refreshToken: sha256('valid-token') });
usersService.findByRefreshTokenHash.mockResolvedValue(user);
jwtService.sign.mockReturnValue('new-access-token');

// Execute
result = await service.refresh('valid-token');

// Assert
expect(usersService.findByRefreshTokenHash).toHaveBeenCalledWith(sha256('valid-token'));
expect(result).toEqual({ accessToken: 'new-access-token' });
```

### TC-102: Invalid Refresh Token
```typescript
// Setup
usersService.findByRefreshTokenHash.mockResolvedValue(null);

// Execute & Assert
await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
```

### TC-103: Banned User
```typescript
// Setup
user = mockUser({ isActive: false, refreshToken: sha256('some-token') });
usersService.findByRefreshTokenHash.mockResolvedValue(user);

// Execute & Assert
await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
```

### TC-104: Logout
```typescript
// Setup
usersService.updateRefreshToken.mockResolvedValue(undefined);
res = mockResponse();

// Execute
await service.logout('user-id-123', res);

// Assert
expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-id-123', null);
expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/api/v1/auth' }));
```

## E2E Test Details (Frontend + Backend)

### TC-E2E-1: Auto-Refresh Flow
```typescript
// 1. Login via UI
await page.goto('/login');
await page.fill('input[name="email"]', 'user@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
await expect(page).toHaveURL('/');

// 2. Manually expire accessToken (set expiry to past in localStorage)
// OR mock time advance in test

// 3. Make authenticated request
const response = await page.request.get('/api/v1/users/me', {
  headers: { 'Authorization': `Bearer ${expiredToken}` }
});

// 4. Verify auto-refresh happened (check network for POST /auth/refresh)
// 5. Verify original request retried and succeeded
```

### TC-E2E-2: Expired Refresh → Redirect
```typescript
// 1. Login
// 2. Manually set refreshToken cookie to expired value
// 3. Make API call → 401 → refresh → 401
// 4. Verify redirect to /login
```

### TC-E2E-3: Logout Flow
```typescript
// 1. Login
// 2. Click logout button
// 3. Verify POST /auth/logout called
// 4. Verify refreshToken cookie cleared
// 5. Verify redirect to /login
// 6. Verify subsequent API calls fail with 401
```

## Test Data Requirements

| Data | Source |
|------|--------|
| Valid user credentials | Test DB seed or fixture |
| Expired access token | Generate with past `exp` claim |
| Expired refresh token | Set cookie `expires` to past date |
| Banned user | `isActive: false` in test DB |

## Test Environment

- **Backend:** Jest + NestJS TestingModule (unit)
- **Frontend E2E:** Playwright against running dev servers
- **Database:** MongoDB test instance (separate from dev)

## Pass Criteria

- All 4 unit tests pass (TC-101..104)
- TC-E2E-1 and TC-E2E-3 pass (P0)
- No console errors in browser during E2E
- Zero Critical bugs

## Next Stage
Proceed to **spec-validator** (Stage 7)