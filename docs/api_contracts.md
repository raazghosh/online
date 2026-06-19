# Account Management Service — API Contracts

This document contains the backend REST API contracts ready for implementation/integration.

---

## 1. Profile Details Update

- **Method**: `PUT`
- **Path**: `/auth/me/profile`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "display_name": "John Doe",
    "phone": "+15551234567",
    "bio": "Software Architect & Validator Node manager"
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Profile details updated successfully",
    "data": {
      "display_name": "John Doe",
      "phone": "+15551234567",
      "bio": "Software Architect & Validator Node manager"
    }
  }
  ```

---

## 2. Social Links Update

- **Method**: `PUT`
- **Path**: `/auth/me/social-links`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "links": [
      { "platform": "github", "handle": "johndoe" },
      { "platform": "twitter", "handle": "johndoe_dev" },
      { "platform": "linkedin", "handle": "johndoe-profile" },
      { "platform": "instagram", "handle": "johndoe_insta" },
      { "platform": "website", "handle": "https://johndoe.com" }
    ]
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Social links updated successfully",
    "data": [
      { "platform": "github", "handle": "johndoe" },
      { "platform": "twitter", "handle": "johndoe_dev" },
      { "platform": "linkedin", "handle": "johndoe-profile" },
      { "platform": "instagram", "handle": "johndoe_insta" },
      { "platform": "website", "handle": "https://johndoe.com" }
    ]
  }
  ```

---

## 3. Privacy Settings Update

- **Method**: `PUT`
- **Path**: `/auth/me/privacy`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "profile_visibility": "private", 
    "activity_status": false,
    "search_indexing": false
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Privacy settings updated successfully",
    "data": {
      "profile_visibility": "private",
      "activity_status": false,
      "search_indexing": false
    }
  }
  ```

---

## 4. Notification Preferences Update

- **Method**: `PUT`
- **Path**: `/auth/me/notifications`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "email_alerts": true,
    "sms_alerts": false,
    "push_alerts": true
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Notification preferences updated successfully",
    "data": {
      "email_alerts": true,
      "sms_alerts": false,
      "push_alerts": true
    }
  }
  ```

---

## 5. Security & 2FA

### 5.1 Change Password
- **Method**: `PUT`
- **Path**: `/auth/me/password`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "current_password": "OldSecurePassword123!",
    "new_password": "NewSecurePassword456!"
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

### 5.2 Request 2FA Setup Activation
- **Method**: `GET`
- **Path**: `/auth/me/2fa/setup`
- **Auth**: Required
- **Response — 200 OK**:
  ```json
  {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code": "otpauth://totp/SecureVote:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SecureVote",
    "recovery_codes": [
      "1234-5678",
      "8765-4321",
      "5678-1234"
    ]
  }
  ```

### 5.3 Verify and Enable 2FA
- **Method**: `POST`
- **Path**: `/auth/me/2fa/enable`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "otp": "123456",
    "secret": "JBSWY3DPEHPK3PXP"
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Two-factor authentication enabled successfully"
  }
  ```

### 5.4 Disable 2FA
- **Method**: `POST`
- **Path**: `/auth/me/2fa/disable`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "password": "current-password"
  }
  ```
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Two-factor authentication disabled successfully"
  }
  ```

---

## 6. Session Revocation

### 6.1 Revoke Single Session
- **Method**: `DELETE`
- **Path**: `/auth/sessions/:id`
- **Auth**: Required
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "Session revoked successfully"
  }
  ```

### 6.2 Revoke Other Sessions
- **Method**: `DELETE`
- **Path**: `/auth/sessions/other`
- **Auth**: Required
- **Response — 200 OK**:
  ```json
  {
    "success": true,
    "message": "All other sessions revoked successfully"
  }
  ```

---

## 7. Account Deletion

- **Method**: `DELETE`
- **Path**: `/auth/me`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "password": "current-password"
  }
  ```
- **Response — 202 Accepted**:
  ```json
  {
    "success": true,
    "status": "deleting",
    "message": "Account deletion scheduled successfully"
  }
  ```
